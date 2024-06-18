// https://app.routernitro.com/swap

import { logger } from './../../logger/logger.js';
import { fromWei } from "./../helpers/web3Custom.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";


export class Routernitro {
    static CHAIN_INFO = {
        optimism: {
            chainId: '10',
            allowanceTo: '0x8201c02d4ab2214471e8c3ad6475c8b0cd9f2d06',
            assets: {
                WETH: {
                    decimals: 18,
                    symbol: 'WETH',
                    name: 'WETH',
                    address: '0x4200000000000000000000000000000000000006',
                    resourceID: 'native-eth',
                    isMintable: false,
                    isWrappedAsset: false,
                },
            },
            minAmount: 0.0001,
        },
        arbitrum: {
            chainId: '42161',
            allowanceTo: '0xef300fb4243a0ff3b90c8ccfa1264d78182adaa4',
            assets: {
                WETH: {
                    decimals: 18,
                    symbol: 'WETH',
                    name: 'WETH',
                    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
                    resourceID: 'native-eth',
                    isMintable: false,
                    isWrappedAsset: false,
                },
            },
            minAmount: 0.0001,
        },
        base: {
            chainId: '8453',
            allowanceTo: '0x0fa205c0446cd9eedcc7538c9e24bc55ad08207f',
            assets: {
                WETH: {
                    decimals: 18,
                    symbol: 'WETH',
                    name: 'WETH',
                    address: '0x4200000000000000000000000000000000000006',
                    resourceID: 'native-eth',
                    isMintable: false,
                    isWrappedAsset: false,
                },
            },
            minAmount: 0.0001,
        },
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
            minAmount: 0.0001,
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
            minAmount: 0.0001,
        },
    };

    constructor(provider, signer, proxy = null) {
        this.provider = provider;
        this.signer = signer;
        this.proxy = proxy;
        // throw Error('Router nitro is on maintenance')
    }

    debugLog(message) {
        logger.debug(`"routerNitro"/${message}`);
    }

    async #fetchQuota(amountWei, fromChainInfo, toChainInfo) {
        const url = `https://api-beta.pathfinder.routerprotocol.com/api/v2/quote?fromTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&toTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&amount=${amountWei}&fromTokenChainId=${fromChainInfo.chainId}&toTokenChainId=${toChainInfo.chainId}&partnerId=1&destFuel=0`;
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

        return [ data.bridgeFee.amount, jsonResponse ]
    }

    async bridgeEth(fromChain, toChain, inAmountWei) {
        const fromChainInfo = Routernitro.CHAIN_INFO[fromChain];
        const toChainInfo = Routernitro.CHAIN_INFO[toChain];

        if (!fromChainInfo || !toChainInfo) {
            throw Error(`Unsupported chain in route from chain: ${fromChain} to chain: ${toChain}`);
        }

        if (fromWei(inAmountWei, 'ETH') < fromChainInfo.minAmount) {
            throw Error(
                `${amount} is less than minimum amount for ${fromChain} -> ${toChain} (${fromChainInfo.minAmount})`
            );
        }

        this.debugLog(`"bridgeEth" - inAmount: ${inAmountWei}`);

        try {
            const [ feeWei, instructions ] = await this.#fetchEthTransaction(
                fromChainInfo,
                toChainInfo,
                inAmountWei.toString(),
            );
            
            const { txn } = instructions;
            const inAmountFinal = BigInt(txn.value);
            if (inAmountFinal !== inAmountWei) {
                throw new Error(
                    `Suspicious transaction value: ${inAmountFinal} initial amount hex: ${inAmountWei}`
                );
            }

            if (fromChainInfo.allowanceTo !== txn.to) {
                throw new Error(
                    `Suspicious contract: ${txn.to} initial: ${fromChainInfo.allowanceTo}`
                );
            }

            const resp = await this.signer.sendTransaction(txn);
            const receipt = await resp.wait();
            return receipt;

        } catch (err) {
            console.error(`Failed to bridge: ${err}`);
            throw err;
        }
    }
}