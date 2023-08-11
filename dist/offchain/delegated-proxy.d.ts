import { Signer } from 'ethers';
import { EIP712AttestationParams, EIP712RevocationParams } from './delegated';
import { EIP712MessageTypes, EIP712Response, TypedData, TypedDataConfig, TypedDataHandler } from './typed-data-handler';
export { EIP712MessageTypes, EIP712TypedData, EIP712Request, EIP712Response, TypedDataConfig } from './typed-data-handler';
export declare const ATTEST_PROXY_TYPED_SIGNATURE = "Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint64 deadline)";
export declare const REVOKE_PROXY_TYPED_SIGNATURE = "Revoke(bytes32 schema,bytes32 uid,uint64 deadline)";
export declare const ATTEST_PROXY_PRIMARY_TYPE = "Attest";
export declare const REVOKE_PROXY_PRIMARY_TYPE = "Revoke";
export declare const ATTEST_PROXY_TYPE: TypedData[];
export declare const REVOKE_PROXY_TYPE: TypedData[];
export type EIP712AttestationProxyParams = EIP712AttestationParams & {
    deadline: bigint;
};
export type EIP712RevocationProxyParams = EIP712RevocationParams & {
    deadline: bigint;
};
export declare class DelegatedProxy extends TypedDataHandler {
    constructor(config: TypedDataConfig);
    signDelegatedProxyAttestation(params: EIP712AttestationProxyParams, signer: Signer): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>>;
    verifyDelegatedProxyAttestationSignature(attester: string, response: EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>): boolean;
    signDelegatedProxyRevocation(params: EIP712RevocationProxyParams, signer: Signer): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>>;
    verifyDelegatedProxyRevocationSignature(attester: string, response: EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>): boolean;
}
