import { DataBase } from './src/data/dataBase.js';
import { BridgeExecutor } from './src/utils/bridgeExecutor.js';
import { shuffleArray, sleep, randInt } from './src/utils/helpers.js';
import { logger } from './src/logger/logger.js';
import { userConfig } from './userConfig.js';



const startBridging = async () => { 
    const dataBase = new DataBase();
    dataBase.generateNewWalletsFromTxt('wallets.txt');

    const remainingWallets = dataBase.getRemainingWallets();
    const shuffledRemainingWallets = shuffleArray(remainingWallets);
    logger.info(`Wallets remaining: ${remainingWallets.length}/${dataBase.walletObjects.length}`)

    for (const wallet of shuffledRemainingWallets) {
        logger.info(`${wallet.name} - starting bridge operation`);

        const bridgeExecutor = new BridgeExecutor(wallet);
        await bridgeExecutor.bridge();
        // save wallet data

        const delay = randInt(userConfig.accDelaySec[0], userConfig.accDelaySec[1])
        logger.info(`${wallet.name} - sleeping ${(delay / 60).toFixed(2)} minutes`)
        await sleep(delay);
    }

    logger.info('Finished work');
};


startBridging();