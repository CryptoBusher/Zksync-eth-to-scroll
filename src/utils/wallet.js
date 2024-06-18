export class Wallet {
    constructor(name, privateKey, proxy, progress) {
        this.name = name;
        this.privateKey = privateKey;
        this.proxy = proxy;
        this.progress = progress;
    }

    update_progress(newProgress) {
        this.progress = newProgress;
    }
};