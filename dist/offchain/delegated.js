import { TypedDataHandler } from './typed-data-handler';
export const EIP712_NAME = 'EAS';
export const ATTEST_TYPED_SIGNATURE = 'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 nonce)';
export const REVOKE_TYPED_SIGNATURE = 'Revoke(bytes32 schema,bytes32 uid,uint256 nonce)';
export const ATTEST_PRIMARY_TYPE = 'Attest';
export const REVOKE_PRIMARY_TYPE = 'Revoke';
export const ATTEST_TYPE = [
    { name: 'schema', type: 'bytes32' },
    { name: 'recipient', type: 'address' },
    { name: 'expirationTime', type: 'uint64' },
    { name: 'revocable', type: 'bool' },
    { name: 'refUID', type: 'bytes32' },
    { name: 'data', type: 'bytes' },
    { name: 'nonce', type: 'uint256' }
];
export const REVOKE_TYPE = [
    { name: 'schema', type: 'bytes32' },
    { name: 'uid', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' }
];
export class Delegated extends TypedDataHandler {
    constructor(config) {
        super({ ...config, name: EIP712_NAME });
    }
    signDelegatedAttestation(params, signer) {
        return this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: ATTEST_PRIMARY_TYPE,
            message: params,
            types: {
                Attest: ATTEST_TYPE
            }
        }, signer);
    }
    verifyDelegatedAttestationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response);
    }
    signDelegatedRevocation(params, signer) {
        return this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: REVOKE_PRIMARY_TYPE,
            message: params,
            types: {
                Revoke: REVOKE_TYPE
            }
        }, signer);
    }
    verifyDelegatedRevocationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response);
    }
}
//# sourceMappingURL=delegated.js.map