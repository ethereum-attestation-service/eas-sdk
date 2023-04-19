export class Transaction {
    tx;
    waitCallback;
    constructor(tx, waitCallback) {
        this.tx = tx;
        this.waitCallback = waitCallback;
    }
    async wait(confirmations) {
        const receipt = await this.tx.wait(confirmations);
        return this.waitCallback(receipt);
    }
}
export class Base {
    contract;
    constructor(factory, address, signerOrProvider) {
        this.contract = factory.attach(address);
        if (signerOrProvider) {
            this.connect(signerOrProvider);
        }
    }
    // Connects the API to a specific signer
    connect(signerOrProvider) {
        this.contract = this.contract.connect(signerOrProvider);
        return this;
    }
}
//# sourceMappingURL=transaction.js.map