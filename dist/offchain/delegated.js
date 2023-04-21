"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delegated = exports.REVOKE_TYPE = exports.ATTEST_TYPE = exports.REVOKE_PRIMARY_TYPE = exports.ATTEST_PRIMARY_TYPE = exports.REVOKE_TYPED_SIGNATURE = exports.ATTEST_TYPED_SIGNATURE = exports.EIP712_NAME = void 0;
const typed_data_handler_1 = require("./typed-data-handler");
exports.EIP712_NAME = 'EAS';
exports.ATTEST_TYPED_SIGNATURE = 'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 nonce)';
exports.REVOKE_TYPED_SIGNATURE = 'Revoke(bytes32 schema,bytes32 uid,uint256 nonce)';
exports.ATTEST_PRIMARY_TYPE = 'Attest';
exports.REVOKE_PRIMARY_TYPE = 'Revoke';
exports.ATTEST_TYPE = [
    { name: 'schema', type: 'bytes32' },
    { name: 'recipient', type: 'address' },
    { name: 'expirationTime', type: 'uint64' },
    { name: 'revocable', type: 'bool' },
    { name: 'refUID', type: 'bytes32' },
    { name: 'data', type: 'bytes' },
    { name: 'nonce', type: 'uint256' }
];
exports.REVOKE_TYPE = [
    { name: 'schema', type: 'bytes32' },
    { name: 'uid', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' }
];
class Delegated extends typed_data_handler_1.TypedDataHandler {
    constructor(config) {
        super({ ...config, name: exports.EIP712_NAME });
    }
    signDelegatedAttestation(params, signer) {
        return this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: exports.ATTEST_PRIMARY_TYPE,
            message: params,
            types: {
                Attest: exports.ATTEST_TYPE
            }
        }, signer);
    }
    verifyDelegatedAttestationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response);
    }
    signDelegatedRevocation(params, signer) {
        return this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: exports.REVOKE_PRIMARY_TYPE,
            message: params,
            types: {
                Revoke: exports.REVOKE_TYPE
            }
        }, signer);
    }
    verifyDelegatedRevocationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response);
    }
}
exports.Delegated = Delegated;
//# sourceMappingURL=delegated.js.map