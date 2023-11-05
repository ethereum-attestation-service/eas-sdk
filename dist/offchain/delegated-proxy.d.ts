import { Signer } from 'ethers';
import { EIP712AttestationParams, EIP712RevocationParams } from './delegated';
import { EIP712MessageTypes, EIP712Response, TypedDataConfig, TypedDataHandler } from './typed-data-handler';
export { EIP712MessageTypes, EIP712TypedData, EIP712Request, EIP712Response, TypedDataConfig } from './typed-data-handler';
export declare enum DelegatedProxyAttestationVersion {
    Legacy = 0,
    Version1 = 1,
    Version2 = 2
}
export type EIP712AttestationProxyParams = EIP712AttestationParams & {
    deadline: bigint;
};
export type EIP712RevocationProxyParams = EIP712RevocationParams & {
    deadline: bigint;
};
export declare class DelegatedProxy extends TypedDataHandler {
    readonly version: DelegatedProxyAttestationVersion;
    private readonly attestType;
    private readonly revokeType;
    constructor(config: TypedDataConfig);
    signDelegatedProxyAttestation(params: EIP712AttestationProxyParams, signer: Signer): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>>;
    verifyDelegatedProxyAttestationSignature(attester: string, response: EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>): boolean;
    signDelegatedProxyRevocation(params: EIP712RevocationProxyParams, signer: Signer): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>>;
    verifyDelegatedProxyRevocationSignature(revoker: string, response: EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>): boolean;
}
