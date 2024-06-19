import { ethers, JsonRpcProvider, formatEther, parseEther, FetchRequest } from "ethers";
import { HttpsProxyAgent } from "https-proxy-agent";

import { logger } from './../logger/logger.js';
import { randFloat, weightedRandomChoice, roundToAppropriateDecimalPlace } from './../utils/helpers.js';
import { Routernitro } from './../modules/routerNitro.js';


export class BridgeExecutor {
    static BRIDGES_MAP = {
        'routerNitro': Routernitro
    };

    constructor(userConfig) {
        this.minEthToProcessWei = parseEther(userConfig.minimalBalanceEth.toString());
        this.bridgesToUse = userConfig.bridgesToUse;
        this.rpcs = userConfig.rpcs;
        this.generalProxy = userConfig.generalProxy;
        this.slippages = userConfig.slippages;
        this.maxFeeWei = parseEther(userConfig.maxFeeEth.toString());
    }

    debugLog(message) {
        logger.debug(`"BridgeExecutor": ${message}`);
    }

    #chooseBridgeToUse() {
        return weightedRandomChoice(this.bridgesToUse);
    }

    #generateProviderAndSigner(walletObject, chainName) {
        if (!this.rpcs.hasOwnProperty(chainName) || this.rpcs[chainName] === '') {
            throw Error(`RPC is not provided for ${chainName}, check config`)
        }

        const fetchRequest = new FetchRequest(this.rpcs[chainName]);
        fetchRequest.getUrlFunc = FetchRequest.createGetUrlFunc({
			agent: new HttpsProxyAgent(walletObject.proxy ? walletObject.proxy : this.generalProxy.address),
		});

        const provider = new JsonRpcProvider(fetchRequest);
		const signer = new ethers.Wallet(walletObject.privateKey, provider);

        return [ provider, signer ];
    }

    async #changeGeneralProxyIp() {

    }

    async bridge(walletObject) {
        if (!walletObject.proxy) {
            await this.#changeGeneralProxyIp();
        }

        const [ provider, signer ] = this.#generateProviderAndSigner(walletObject, 'zksyncera');
        const bridgeToUseName = this.#chooseBridgeToUse();
        const bridgeToUse = BridgeExecutor.BRIDGES_MAP[bridgeToUseName];
        this.debugLog(`bridgeToUseName ${bridgeToUseName}`);
        const bridge = new bridgeToUse(
            provider,
            signer,
            this.slippages,
            walletObject.proxy ? walletObject.proxy : this.generalProxy.address
        );
        this.debugLog(`bridge initialized`);

        try {
            const [ actualAmountWei, txHash, ethSpent ] = await bridge.bridgeEthMax('zksyncera', 'scroll', this.minEthToProcessWei, this.maxFeeWei);

            return {
                isDone: true,
                bridgeUsed: bridgeToUseName,
                amountBridged: parseFloat(formatEther(await actualAmountWei.toString())),
                txHash: await txHash,
                ethSpent: await ethSpent,
                comment: 'success'
            };
        } catch (e) {
            if (e.message.includes('wallet balance is less than minimum set by user')) {
                return {
                    isDone: true,
                    comment: e.message
                };
            } else {
                throw new Error(e.message);
            }
        }
    }
}