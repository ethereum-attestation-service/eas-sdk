import { TypedDataHandler } from './typed-data-handler';
export const ATTEST_PROXY_TYPED_SIGNATURE = 'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint64 deadline)';
export const REVOKE_PROXY_TYPED_SIGNATURE = 'Revoke(bytes32 schema,bytes32 uid,uint64 deadline)';
export const ATTEST_PROXY_PRIMARY_TYPE = 'Attest';
export const REVOKE_PROXY_PRIMARY_TYPE = 'Revoke';
export const ATTEST_PROXY_TYPE = [
    { name: 'schema', type: 'bytes32' },
    { name: 'recipient', type: 'address' },
    { name: 'expirationTime', type: 'uint64' },
    { name: 'revocable', type: 'bool' },
    { name: 'refUID', type: 'bytes32' },
    { name: 'data', type: 'bytes' },
    { name: 'deadline', type: 'uint64' }
];
export const REVOKE_PROXY_TYPE = [
    { name: 'schema', type: 'bytes32' },
    { name: 'uid', type: 'bytes32' },
    { name: 'deadline', type: 'uint64' }
];
export class DelegatedProxy extends TypedDataHandler {
    constructor(config) {
        super(config);
    }
    signDelegatedProxyAttestation(params, signer) {
        return this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: ATTEST_PROXY_PRIMARY_TYPE,
            message: params,
            types: {
                Attest: ATTEST_PROXY_TYPE
            }
        }, signer);
    }
    verifyDelegatedProxyAttestationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response);
    }
    signDelegatedProxyRevocation(params, signer) {
        return this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: REVOKE_PROXY_PRIMARY_TYPE,
            message: params,
            types: {
                Revoke: REVOKE_PROXY_TYPE
            }
        }, signer);
    }
    verifyDelegatedProxyRevocationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response);
    }
}
//# sourceMappingURL=delegated-proxy.js.map