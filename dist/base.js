"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = void 0;
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
}
exports.Base = Base;
//# sourceMappingURL=base.js.map