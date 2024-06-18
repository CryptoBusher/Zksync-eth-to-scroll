// https://orbiter.finance/

import { randomChoice } from "./../helpers/basic.js";
import { toWei, calculateEthSpent } from "./../helpers/web3Custom.js"
import { logger } from "./../../logger/logger.js";


export class Orbiter {
    static ROUTER_ADDRESSES = [
        "0x80C67432656d59144cEFf962E8fAF8926599bCF8",
        "0xe4edb277e41dc89ab076a1f049f4a3efa700bce8"
    ];
    static TO_CHAIN_IDS = {
		optimism: 9007,
		arbitrum: 9002,
        scroll: 9019,
        base: 9021,
        zksyncera: 9014

    };
    static FROM_CHAIN_INFO = {
        optimism: {
            minAmount: 0.0001,
            fee: 0.0012
        },
        arbitrum: {
            minAmount: 0.0001,
            fee: 0.0012
        },
		scroll: {
			minAmount: 0.0001,
			fee: 0.0013
		},
        base: {
			minAmount: 0.00005,
			fee: 0.0013
        },
        zksyncera: {
			minAmount: 0.00005,
			fee: 0.001
        }
    }

    constructor(outChainProvider, outChainSigner) {
        this.outChainProvider = outChainProvider;
        this.outChainSigner = outChainSigner;
    }

    debugLog(message) {
		logger.debug(`"orbiter"/${message}`);
	}

    async bridgeEth(fromChain, toChain, amountEth) {
        if (amountEth < Orbiter.FROM_CHAIN_INFO[fromChain].minAmount) {
            throw Error(`${amountEth} is less than minimum amount for ${fromChain} -> ${toChain} (${Orbiter.FROM_CHAIN_INFO[fromChain].minAmount})`);
        }

        const orbiterFeeEth = Orbiter.FROM_CHAIN_INFO[fromChain].fee;
        this.debugLog(`"bridgeEth" - orbiterFeeEth: ${orbiterFeeEth}`);
        const amountWithFeeWei = toWei('ETH', amountEth) + toWei('ETH', orbiterFeeEth);
        this.debugLog(`"bridgeEth" - amountWithFeeWei: ${amountWithFeeWei}`);
        const finalAmountWithIndexWei = amountWithFeeWei + BigInt(Orbiter.TO_CHAIN_IDS[toChain]);
        this.debugLog(`"bridgeEth" - finalAmountWithIndexWei: ${finalAmountWithIndexWei}`);

        const routerAddressToUse = randomChoice(Orbiter.ROUTER_ADDRESSES);
        this.debugLog(`"bridgeEth" - routerAddressToUse: ${routerAddressToUse}`);
        const tx = await this.outChainSigner.sendTransaction({ to: routerAddressToUse, value: finalAmountWithIndexWei });
        const receipt = await tx.wait();

        const txData = fromChain === 'scroll' ? await tx.data : null;
        const txFee = fromChain === 'scroll' ? await calculateEthSpent(receipt, fromChain, txData, outChainProvider) : await calculateEthSpent(receipt, fromChain)

        const report = [{
            hash: await receipt.hash,
            ethSpent: txFee + Orbiter.FROM_CHAIN_INFO[fromChain].fee
        }]

        return report;
    }
}