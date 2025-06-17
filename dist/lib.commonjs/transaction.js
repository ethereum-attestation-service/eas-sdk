"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = exports.Transaction = exports.RequireSigner = void 0;
const tslib_1 = require("tslib");
const RequireSigner = (_target, _propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = function (...args) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signer = this.signer;
        if (!signer || !signer.sendTransaction) {
            throw new Error('Invalid signer');
        }
        return originalMethod.apply(this, args);
    };
    return descriptor;
};
exports.RequireSigner = RequireSigner;
class Transaction {
    data;
    receipt;
    signer;
    waitCallback;
    constructor(data, signer, waitCallback) {
        this.data = data;
        this.signer = signer;
        this.waitCallback = waitCallback;
    }
    async wait(confirmations) {
        if (this.receipt) {
            throw new Error(`Transaction already broadcast: ${this.receipt}`);
        }
        const tx = await this.signer.sendTransaction(this.data);
        this.receipt = await tx.wait(confirmations);
        if (!this.receipt) {
            throw new Error(`Unable to confirm: ${tx}`);
        }
        return this.waitCallback(this.receipt);
    }
}
exports.Transaction = Transaction;
tslib_1.__decorate([
    exports.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Promise)
], Transaction.prototype, "wait", null);
class Base {
    contract;
    signer;
    constructor(factory, address, signer) {
        this.contract = factory.attach(address);
        if (signer) {
            this.connect(signer);
            this.signer = signer;
        }
    }
    // Connects the API to a specific signer
    connect(signer) {
        this.contract = this.contract.connect(signer);
        this.signer = signer;
        return this;
    }
    // Gets the chain ID
    async getChainId() {
        const provider = this.contract.runner?.provider;
        if (!provider) {
            throw new Error("Unable to get the chain ID: provider wasn't set");
        }
        return (await provider.getNetwork()).chainId;
    }
}
exports.Base = Base;
//# sourceMappingURL=transaction.js.map