import 'dotenv/config';


export const userConfig = {
    accDelaySec: [1800, 5400],
    minimalBalanceEth: 0.0005,
    slippages: [0.1, 0.2],
    maxFeeEth: 0.00035,
    bridgesToUse: {
        'routerNitro': 1
    },
    rpcs: {
        'zksyncera': process.env.ZKSYNCERA_RPC
    },
    generalProxy: {
        'address': '',
        'link': ''
    },
	telegramData: {	
		botToken: process.env.TG_BOT_TOKEN,
		chatIds: [
			process.env.TG_CHAT_ID,
		]
	},
};
