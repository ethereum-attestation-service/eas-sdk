"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedDataHandler = void 0;
const utils_1 = require("../utils");
const ethers_1 = require("ethers");
const { getAddress, solidityPack, verifyTypedData, defaultAbiCoder, keccak256, hexlify, joinSignature, splitSignature } = ethers_1.utils;
class TypedDataHandler {
    config;
    constructor(config) {
        this.config = config;
    }
    async signTypedDataRequest(params, types, signer) {
        const rawSignature = await signer._signTypedData(types.domain, types.types, params);
        return { types, params, ...splitSignature(rawSignature) };
    }
    async verifyTypedDataRequestSignature(attester, request) {
        if (attester === utils_1.ZERO_ADDRESS) {
            throw new Error('Invalid address');
        }
        const sig = joinSignature({ v: request.v, r: hexlify(request.r), s: hexlify(request.s) });
        const recoveredAddress = verifyTypedData(request.types.domain, request.types.types, request.params, sig);
        return getAddress(attester) === getAddress(recoveredAddress);
    }
    getDigest(params) {
        return keccak256(solidityPack(['bytes1', 'bytes1', 'bytes32', 'bytes32'], ['0x19', '0x01', this.getDomainSeparator(), keccak256(defaultAbiCoder.encode(params.types, params.values))]));
    }
}
exports.TypedDataHandler = TypedDataHandler;
//# sourceMappingURL=typed-data-handler.js.map