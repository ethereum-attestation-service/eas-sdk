"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedDataHandler = exports.EIP712_DOMAIN = void 0;
const tslib_1 = require("tslib");
const ethers_1 = require("ethers");
const isEqual_1 = tslib_1.__importDefault(require("lodash/isEqual"));
const utils_1 = require("../utils");
exports.EIP712_DOMAIN = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
class TypedDataHandler {
    config;
    constructor(config) {
        this.config = config;
    }
    getDomainSeparator() {
        return (0, ethers_1.keccak256)(ethers_1.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'], [
            (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(exports.EIP712_DOMAIN)),
            (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(this.config.name)),
            (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(this.config.version)),
            this.config.chainId,
            this.config.address
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
        const signature = ethers_1.Signature.from(rawSignature);
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
            throw new Error('Invalid domain');
        }
        if (response.primaryType !== types.primaryType) {
            throw new Error('Invalid primary type');
        }
        if (!(0, isEqual_1.default)(response.types, types.types)) {
            throw new Error('Invalid types');
        }
        if (attester === utils_1.ZERO_ADDRESS) {
            throw new Error('Invalid address');
        }
        const { signature } = response;
        const sig = ethers_1.Signature.from({ v: signature.v, r: (0, ethers_1.hexlify)(signature.r), s: (0, ethers_1.hexlify)(signature.s) }).serialized;
        const recoveredAddress = (0, ethers_1.verifyTypedData)(domain, response.types, response.message, sig);
        return (0, ethers_1.getAddress)(attester) === (0, ethers_1.getAddress)(recoveredAddress);
    }
}
exports.TypedDataHandler = TypedDataHandler;
//# sourceMappingURL=typed-data-handler.js.map