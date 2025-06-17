import { __decorate, __metadata } from "tslib";
export const RequireSigner = (_target, _propertyKey, descriptor) => {
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
export class Transaction {
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
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], Transaction.prototype, "wait", null);
export class Base {
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
//# sourceMappingURL=transaction.js.map