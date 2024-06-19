import { DataBase } from './src/data/dataBase.js';
import { BridgeExecutor } from './src/utils/bridgeExecutor.js';
import { shuffleArray, sleep, randInt } from './src/utils/helpers.js';
import { logger } from './src/logger/logger.js';
import { userConfig } from './userConfig.js';



const startBridging = async () => { 
    const dataBase = new DataBase();
    const bridgeExecutor = new BridgeExecutor(userConfig);

    dataBase.generateNewWalletsFromTxt('wallets.txt');

    const remainingWallets = dataBase.getRemainingWallets();
    const shuffledRemainingWallets = shuffleArray(remainingWallets);
    logger.info(`Wallets remaining: ${remainingWallets.length}/${dataBase.walletObjects.length}`)

    for (const wallet of shuffledRemainingWallets) {
        logger.info(`${wallet.name} - starting bridge operation`);

        try {
            const updatedProgress = await bridgeExecutor.bridge(wallet);
            wallet.progress = {
                ...wallet.progress,
                ...updatedProgress
            };
            
            const logMsg = `${wallet.name} - ${wallet.progress.comment}` + (wallet.progress.txHash ? `, https://explorer.zksync.io/tx/${wallet.progress.txHash}` : '');
            logger.info(logMsg);
        } catch (e) {
            wallet.progress.fails ++;
            wallet.progress.comment = e.message;
            logger.error(`${wallet.name} - failed, reason: ${e.message}`);
        }

        dataBase.saveWallet(wallet);

        const delay = randInt(userConfig.accDelaySec[0], userConfig.accDelaySec[1])
        logger.info(`${wallet.name} - sleeping ${(delay / 60).toFixed(2)} minutes`)
        await sleep(delay);
    }

    logger.info('Finished work');
};


startBridging();