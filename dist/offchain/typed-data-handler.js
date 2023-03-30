"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedDataHandler = void 0;
const utils_1 = require("../utils");
const ethers_1 = require("ethers");
const { getAddress, verifyTypedData, hexlify, joinSignature, splitSignature } = ethers_1.utils;
class TypedDataHandler {
    config;
    constructor(config) {
        this.config = config;
    }
    async signTypedDataRequest(params, types, signer) {
        const rawSignature = await signer._signTypedData(types.domain, types.types, params);
        const signature = splitSignature(rawSignature);
        return { ...types, signature: { v: signature.v, r: signature.r, s: signature.s } };
    }
    verifyTypedDataRequestSignature(attester, request) {
        if (attester === utils_1.ZERO_ADDRESS) {
            throw new Error('Invalid address');
        }
        const { signature } = request;
        const sig = joinSignature({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) });
        const recoveredAddress = verifyTypedData(request.domain, request.types, request.message, sig);
        return getAddress(attester) === getAddress(recoveredAddress);
    }
}
exports.TypedDataHandler = TypedDataHandler;
//# sourceMappingURL=typed-data-handler.js.map