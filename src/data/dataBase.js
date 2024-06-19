import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';


import { txtToArray, clearTxtFile } from './../utils/helpers.js'
import { Wallet } from './../utils/wallet.js'


export class DataBase {
    static DIRNAME = path.dirname(fileURLToPath(import.meta.url));

    constructor() {
        this.#initDataFilesDir();
        this.walletObjects = [];
        this.#loadAllWallets();
    }

    #initDataFilesDir() {
        const dir = `${DataBase.DIRNAME}/dataFiles`
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }

    #loadWallet(filePath) {
        const walletData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return new Wallet(walletData.name, walletData.privateKey, walletData.proxy, walletData.progress);
    }

    #loadAllWallets() {
        const walletFileNames = fs.readdirSync(`${DataBase.DIRNAME}/dataFiles`)
        for (const walletFileName of walletFileNames) {
            const walletFilePath = `${DataBase.DIRNAME}/dataFIles/${walletFileName}` ;
            this.walletObjects.push(this.#loadWallet(walletFilePath));
        }
    }

    saveWallet(walletObj) {
        const jsonData = JSON.stringify(walletObj, null, 2);
        fs.writeFileSync(`${DataBase.DIRNAME}/dataFiles/${walletObj.name}.json`, jsonData);
    }

    generateNewWalletsFromTxt(path) {
        const newWalletsData = txtToArray(path)
        for (const walletData of newWalletsData) {
            const [ name, privateKey, proxy ] = walletData.split('|');
            const progress = {
                isDone: false,
                fails: 0,
                bridgeUsed: '',
                amountBridged: 0,
                txHash: '',
                ethSpent: 0,
                comment: ''
            };
            const newWallet = new Wallet( name, privateKey, proxy, progress);

            this.walletObjects.push(newWallet);
            this.saveWallet(newWallet);
        }

        clearTxtFile(path);
    }

    getRemainingWallets() {
        return this.walletObjects.filter(i => i.progress.isDone === false);
    }

    saveWallet(walletObj) {
        const jsonData = JSON.stringify(walletObj, null, 2);
        fs.writeFileSync(`${DataBase.DIRNAME}/dataFiles/${walletObj.name}.json`, jsonData);
    }
}