"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = void 0;
class Base {
    contract;
    constructor(factory, address) {
        this.contract = factory.attach(address);
    }
    // Connects the API to a specific signer
    connect(signer) {
        this.contract = this.contract.connect(signer);
        return this;
    }
}
exports.Base = Base;
//# sourceMappingURL=base.js.map