import { __decorate, __metadata } from "tslib";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RequireSigner(...args) {
    // Standard decorator: (value, context)
    if (args.length === 2) {
        const [value] = args;
        const wrapped = function (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...fnArgs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const signer = this.signer;
            if (!signer || !signer.sendTransaction) {
                throw new Error('Invalid signer');
            }
            return value.apply(this, fnArgs);
        };
        return wrapped;
    }
    // Legacy decorator: (target, propertyKey, descriptor)
    const [_target, _propertyKey, descriptor] = args;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = descriptor.value;
    descriptor.value = function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...fnArgs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signer = this.signer;
        if (!signer || !signer.sendTransaction) {
            throw new Error('Invalid signer');
        }
        return original.apply(this, fnArgs);
    };
    return descriptor;
}
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
    // Estimate gas for the transaction
    estimateGas() {
        return this.signer.estimateGas(this.data);
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