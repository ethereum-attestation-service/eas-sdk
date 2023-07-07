"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = exports.Transaction = void 0;
class Transaction {
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
exports.Transaction = Transaction;
class Base {
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
    // Gets the chain ID
    async getChainId() {
        if (!this.contract.provider) {
            throw new Error("Unable to get the chain ID: provider wasn't set");
        }
        return (await this.contract.provider.getNetwork()).chainId;
    }
}
exports.Base = Base;
//# sourceMappingURL=transaction.js.map