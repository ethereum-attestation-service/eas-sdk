"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delegated = exports.EIP712_NAME = exports.EIP712_DOMAIN = exports.REVOKE_TYPE = exports.ATTEST_TYPE = exports.REVOKE_PRIMARY_TYPE = exports.ATTEST_PRIMARY_TYPE = void 0;
const typed_data_handler_1 = require("./typed-data-handler");
const ethers_1 = require("ethers");
const { keccak256, toUtf8Bytes, defaultAbiCoder } = ethers_1.utils;
exports.ATTEST_PRIMARY_TYPE = 'Attest';
exports.REVOKE_PRIMARY_TYPE = 'Revoke';
exports.ATTEST_TYPE = [
    { name: 'recipient', type: 'address' },
    { name: 'schema', type: 'bytes32' },
    { name: 'expirationTime', type: 'uint32' },
    { name: 'refUUID', type: 'bytes32' },
    { name: 'data', type: 'bytes' },
    { name: 'nonce', type: 'uint256' }
];
exports.REVOKE_TYPE = [
    { name: 'uuid', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' }
];
exports.EIP712_DOMAIN = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
exports.EIP712_NAME = 'EAS';
class Delegated extends typed_data_handler_1.TypedDataHandler {
    constructor(config) {
        super(config);
    }
    getDomainSeparator() {
        return keccak256(defaultAbiCoder.encode(['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'], [
            keccak256(toUtf8Bytes(exports.EIP712_DOMAIN)),
            keccak256(toUtf8Bytes(exports.EIP712_NAME)),
            keccak256(toUtf8Bytes(this.config.version)),
            this.config.chainId,
            this.config.address
        ]));
    }
    getDomainTypedData() {
        return {
            name: exports.EIP712_NAME,
            version: this.config.version,
            chainId: this.config.chainId,
            verifyingContract: this.config.address
        };
    }
    getTypedData(type, params) {
        switch (type) {
            case exports.ATTEST_PRIMARY_TYPE:
                return {
                    domain: this.getDomainTypedData(),
                    primaryType: exports.ATTEST_PRIMARY_TYPE,
                    message: params,
                    types: {
                        Attest: exports.ATTEST_TYPE
                    }
                };
            case exports.REVOKE_PRIMARY_TYPE:
                return {
                    domain: this.getDomainTypedData(),
                    primaryType: exports.REVOKE_PRIMARY_TYPE,
                    message: params,
                    types: {
                        Revoke: exports.REVOKE_TYPE
                    }
                };
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    }
    async signDelegatedAttestation(params, signer) {
        return this.signTypedDataRequest(exports.ATTEST_PRIMARY_TYPE, params, signer);
    }
    async verifyDelegatedAttestationSignature(attester, request) {
        return this.verifyTypedDataRequestSignature(attester, request);
    }
    async signDelegatedRevocation(params, signer) {
        return this.signTypedDataRequest(exports.REVOKE_PRIMARY_TYPE, params, signer);
    }
    async verifyDelegatedRevocationTypedData(attester, request) {
        return this.verifyTypedDataRequestSignature(attester, request);
    }
}
exports.Delegated = Delegated;
//# sourceMappingURL=delegated.js.map