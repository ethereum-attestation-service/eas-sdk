"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedDataHandler = exports.InvalidAddress = exports.InvalidTypes = exports.InvalidPrimaryType = exports.InvalidDomain = exports.EIP712_DOMAIN = void 0;
const tslib_1 = require("tslib");
const ethers_1 = require("ethers");
const isEqual_1 = tslib_1.__importDefault(require("lodash/isEqual"));
const viem_1 = require("viem");
const utils_1 = require("../utils");
exports.EIP712_DOMAIN = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
class InvalidDomain extends Error {
}
exports.InvalidDomain = InvalidDomain;
class InvalidPrimaryType extends Error {
}
exports.InvalidPrimaryType = InvalidPrimaryType;
class InvalidTypes extends Error {
}
exports.InvalidTypes = InvalidTypes;
class InvalidAddress extends Error {
}
exports.InvalidAddress = InvalidAddress;
class TypedDataHandler {
    config;
    constructor(config) {
        this.config = config;
    }
    getDomainSeparator() {
        return TypedDataHandler.getDomainSeparator(this.config);
    }
    static getDomainSeparator(config) {
        return (0, ethers_1.keccak256)(ethers_1.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'], [
            (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(exports.EIP712_DOMAIN)),
            (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(config.name)),
            (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(config.version)),
            config.chainId,
            config.address
        ]));
    }
    getDomainTypedData() {
        return {
            name: this.config.name,
            version: this.config.version,
            chainId: this.config.chainId,
            verifyingContract: this.config.address
        };
    }
    async signTypedDataRequest(params, types, signer) {
        const rawSignature = await signer.signTypedData(types.domain, types.types, params);
        const signature = ethers_1.Signature.from((0, viem_1.parseErc6492Signature)(rawSignature).signature);
        return { ...types, signature: { v: signature.v, r: signature.r, s: signature.s } };
    }
    verifyTypedDataRequestSignature(attester, response, types, strict = true) {
        // Normalize the chain ID
        const domain = { ...response.domain, chainId: BigInt(response.domain.chainId) };
        let expectedDomain = this.getDomainTypedData();
        if (!strict) {
            expectedDomain = { ...expectedDomain, version: domain.version };
        }
        if (!(0, isEqual_1.default)(domain, expectedDomain)) {
            throw new InvalidDomain();
        }
        if (response.primaryType !== types.primaryType) {
            throw new InvalidPrimaryType();
        }
        if (!(0, isEqual_1.default)(response.types, types.types)) {
            throw new InvalidTypes();
        }
        if (attester === utils_1.ZERO_ADDRESS) {
            throw new InvalidAddress();
        }
        const { signature } = response;
        const sig = ethers_1.Signature.from({ v: signature.v, r: (0, ethers_1.hexlify)(signature.r), s: (0, ethers_1.hexlify)(signature.s) }).serialized;
        const recoveredAddress = (0, ethers_1.verifyTypedData)(domain, response.types, response.message, sig);
        return (0, ethers_1.getAddress)(attester) === (0, ethers_1.getAddress)(recoveredAddress);
    }
}
exports.TypedDataHandler = TypedDataHandler;
//# sourceMappingURL=typed-data-handler.js.map