"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegatedProxy = exports.REVOKE_PROXY_TYPE = exports.ATTEST_PROXY_TYPE = exports.REVOKE_PROXY_PRIMARY_TYPE = exports.ATTEST_PROXY_PRIMARY_TYPE = exports.REVOKE_PROXY_TYPED_SIGNATURE = exports.ATTEST_PROXY_TYPED_SIGNATURE = void 0;
const typed_data_handler_1 = require("./typed-data-handler");
exports.ATTEST_PROXY_TYPED_SIGNATURE = 'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint64 deadline)';
exports.REVOKE_PROXY_TYPED_SIGNATURE = 'Revoke(bytes32 schema,bytes32 uid,uint64 deadline)';
exports.ATTEST_PROXY_PRIMARY_TYPE = 'Attest';
exports.REVOKE_PROXY_PRIMARY_TYPE = 'Revoke';
exports.ATTEST_PROXY_TYPE = [
    { name: 'schema', type: 'bytes32' },
    { name: 'recipient', type: 'address' },
    { name: 'expirationTime', type: 'uint64' },
    { name: 'revocable', type: 'bool' },
    { name: 'refUID', type: 'bytes32' },
    { name: 'data', type: 'bytes' },
    { name: 'deadline', type: 'uint64' }
];
exports.REVOKE_PROXY_TYPE = [
    { name: 'schema', type: 'bytes32' },
    { name: 'uid', type: 'bytes32' },
    { name: 'deadline', type: 'uint64' }
];
class DelegatedProxy extends typed_data_handler_1.TypedDataHandler {
    constructor(config) {
        super(config);
    }
    signDelegatedProxyAttestation(params, signer) {
        return this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: exports.ATTEST_PROXY_PRIMARY_TYPE,
            message: params,
            types: {
                Attest: exports.ATTEST_PROXY_TYPE
            }
        }, signer);
    }
    verifyDelegatedProxyAttestationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response);
    }
    signDelegatedProxyRevocation(params, signer) {
        return this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: exports.REVOKE_PROXY_PRIMARY_TYPE,
            message: params,
            types: {
                Revoke: exports.REVOKE_PROXY_TYPE
            }
        }, signer);
    }
    verifyDelegatedProxyRevocationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response);
    }
}
exports.DelegatedProxy = DelegatedProxy;
//# sourceMappingURL=delegated-proxy.js.map