// https://app.routernitro.com/swap


// import { fromWei } from "./../helpers/web3Custom.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";


import { formatEther, parseEther } from 'ethers';
import { logger } from './../logger/logger.js';
import { randomChoice } from './../utils/helpers.js';



export class Routernitro {
    static CHAIN_INFO = {
        zksyncera: {
            chainId: '324',
            allowanceTo: '0x8b6f1c18c866f37e6ea98aa539e0c117e70178a2',
            assets: {
                WETH: {
                    decimals: 18,
                    symbol: 'WETH',
                    name: 'WETH',
                    address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
                    resourceID: 'native-eth',
                    isMintable: false,
                    isWrappedAsset: false,
                },
            },
            minAmountWei: parseEther('0.0001'),
        },
        scroll: {
            chainId: '534352',
            allowanceTo: '0x01b4ce0d48ce91eb6bcaf5db33870c65d641b894',
            assets: {
                WETH: {
                    decimals: 18,
                    symbol: 'WETH',
                    name: 'WETH',
                    address: '0x5300000000000000000000000000000000000004',
                    resourceID: 'native-eth',
                    isMintable: false,
                    isWrappedAsset: false,
                },
            },
            minAmountWei: parseEther('0.0001'),
        },
    };

    constructor(provider, signer, slippages, proxy = null) {
        this.provider = provider;
        this.signer = signer;
        this.slippages = slippages;
        this.proxy = proxy;
    }

    debugLog(message) {
        logger.debug(`"Routernitro": ${message}`);
    }

    #getSlippage() {
        return randomChoice(this.slippages);
    }

    async #fetchQuota(amountWei, fromChainInfo, toChainInfo) {
        const url = `https://api-beta.pathfinder.routerprotocol.com/api/v2/quote?fromTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&toTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&amount=${amountWei}&fromTokenChainId=${fromChainInfo.chainId}&toTokenChainId=${toChainInfo.chainId}&partnerId=1&slippageTolerance=${this.#getSlippage()}&destFuel=0`;
        const headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "Referer": "https://app.routernitro.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        };

        const settings = {
            method: 'GET',
            timeout: 5000,
            agent: new HttpsProxyAgent(this.proxy),
            headers: headers
        }

        const response = await fetch(url, settings);

        if (response.status !== 200) {
            throw Error(`Api call failure: ${JSON.stringify(await response.json())})`);
        }

        const jsonResponse = await response.json();
        
        if (!jsonResponse) {
            throw Error(`Cannot fetch quota`);
        }

        this.debugLog(`"_fetchQuota": feeData: ${JSON.stringify(jsonResponse.bridgeFee)}`);

        if (jsonResponse.bridgeFee.amount === '0') {
            throw Error(`Suspicious fee: ${feeData.fee.amount}`);
        }

        return jsonResponse;
    }

    async #fetchEthTransaction(fromChainInfo, toChainInfo, amount) {
        const data = await this.#fetchQuota(amount, fromChainInfo, toChainInfo);
        data.senderAddress = this.signer.address;
        data.receiverAddress = this.signer.address;

        this.debugLog(`data.senderAddress: ${data.senderAddress}`);

        const url = 'https://api-beta.pathfinder.routerprotocol.com/api/v2/transaction';

        const headers = {
            'content-type': 'application/json',
        };

        const settings = {
            method: 'POST',
            timeout: 5000,
            agent: new HttpsProxyAgent(this.proxy),
            headers: headers,
            body: JSON.stringify(data)
        }

        const response = await fetch(url, settings);

        if (response.status != 200) {
            throw Error(`Api call failure: ${JSON.stringify(await response.json())})`);
        }

        const jsonResponse = await response.json();

        if (!jsonResponse) {
            throw Error(`Cannot fetch tx params`);
        }

        this.debugLog(`data.bridgeFee.amount ${data.bridgeFee.amount}`);

        return [ data.bridgeFee.amount, jsonResponse ]
    }

    async bridgeEthMax(fromChain, toChain, minUserSetAmountWei, maxFeeWei) {
        const ethBalancetWei = await this.provider.getBalance(this.signer.address);
        this.debugLog(`ethBalancetWei: ${ethBalancetWei}`);
        const amountToBridgeWei = parseEther(parseFloat(formatEther(ethBalancetWei)).toFixed(4))
        this.debugLog(`amountToBridgeWei: ${amountToBridgeWei}`);

        if (minUserSetAmountWei > amountToBridgeWei) {
            throw new Error('wallet balance is less than minimum set by user');
        }

        return await this.bridgeEth(fromChain, toChain, amountToBridgeWei, maxFeeWei);
    }

    async bridgeEth(fromChain, toChain, amountWei, maxFeeWei) {
        const fromChainInfo = Routernitro.CHAIN_INFO[fromChain];
        const toChainInfo = Routernitro.CHAIN_INFO[toChain];
        this.debugLog(`amountWei ${amountWei}`);

        if (!fromChainInfo || !toChainInfo) {
            throw Error(`Unsupported chain in route from chain: ${fromChain} to chain: ${toChain}`);
        }

        if (amountWei < fromChainInfo.minAmountWei) {
            throw new Error(`${amount} is less than minimum amount for ${fromChain} -> ${toChain} (${fromChainInfo.minAmountWei})`
            );
        }

        const [ feeWei, instructions ] = await this.#fetchEthTransaction(fromChainInfo, toChainInfo, amountWei.toString());

        if (BigInt(feeWei) > maxFeeWei) {
            throw new Error(`Exceeds max fee: ${formatEther(BigInt(feeWei))} > ${formatEther(maxFeeWei)}`);
        }
        
        const { txn } = instructions;
        if (BigInt(txn.value) !== amountWei) {
            throw new Error(`Suspicious transaction value: ${BigInt(txn.value)} initial amount hex: ${amountWei}`);
        }

        if (fromChainInfo.allowanceTo !== txn.to) {
            throw new Error(`Suspicious contract: ${txn.to} initial: ${fromChainInfo.allowanceTo}`);
        }

        const chainFeeWei = BigInt(txn.gasPrice) * BigInt(txn.gasLimit);
        this.debugLog(`chainFeeWei ${chainFeeWei}`);

        // Decrease amount if there is no enough balance to pay chain fee
        const walletBalanceWei = await this.provider.getBalance(this.signer.address)
        const balanceRemainingAfterBridgeWei = walletBalanceWei - (chainFeeWei + amountWei);
        this.debugLog(`balanceRemainingAfterBridgeWei ${balanceRemainingAfterBridgeWei}`);

        if (balanceRemainingAfterBridgeWei < 0) {
            this.debugLog('no enough balance to pay chain fees, adjusting amount and retrying...');
            const stepWei = parseEther('0.00001');
            this,this.debugLog(`stepWei ${stepWei}`);

            const minAdjusWei = -balanceRemainingAfterBridgeWei;
            this,this.debugLog(`minAdjusWei ${minAdjusWei}`);
            
            const stepsAmount = Math.ceil(parseFloat(parseEther(minAdjusWei.toString())) / parseFloat(parseEther(stepWei.toString())));
            this.debugLog(`stepsAmount ${stepsAmount}`);  //Math.ceil(

            const amountToAdjustWei = stepWei * BigInt(stepsAmount);
            this.debugLog(`amountToAdjustWei ${amountToAdjustWei}`);

            const adjustedAmountWei = amountWei - amountToAdjustWei;
            this.debugLog(`adjustedAmountWei ${adjustedAmountWei}`);

            return await this.bridgeEth(fromChain, toChain, adjustedAmountWei, maxFeeWei);  // retry 
        }

        const resp = await this.signer.sendTransaction(txn);
        const receipt = await resp.wait();

        const ethSpent = parseFloat(formatEther(chainFeeWei)) + parseFloat(formatEther(BigInt(feeWei)));
        return [ amountWei, await receipt.hash, ethSpent ];
    }
}