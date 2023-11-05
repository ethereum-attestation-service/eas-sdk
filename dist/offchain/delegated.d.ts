import { Signer } from 'ethers';
import { EIP712MessageTypes, EIP712Params, EIP712Response, PartialTypedDataConfig, TypedDataHandler } from './typed-data-handler';
export { EIP712MessageTypes, EIP712TypedData, EIP712Request, EIP712Response, PartialTypedDataConfig } from './typed-data-handler';
export declare const EIP712_NAME = "EAS";
export declare enum DelegatedAttestationVersion {
    Legacy = 0,
    Version1 = 1,
    Version2 = 2
}
export type EIP712AttestationParams = EIP712Params & {
    schema: string;
    recipient: string;
    expirationTime: bigint;
    revocable: boolean;
    refUID: string;
    data: string;
    value: bigint;
    deadline: bigint;
};
export type EIP712RevocationParams = EIP712Params & {
    schema: string;
    uid: string;
    value: bigint;
    deadline: bigint;
};
export declare class Delegated extends TypedDataHandler {
    readonly version: DelegatedAttestationVersion;
    private readonly attestType;
    private readonly revokeType;
    constructor(config: PartialTypedDataConfig);
    signDelegatedAttestation(params: EIP712AttestationParams, signer: Signer): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationParams>>;
    verifyDelegatedAttestationSignature(attester: string, response: EIP712Response<EIP712MessageTypes, EIP712AttestationParams>): boolean;
    signDelegatedRevocation(params: EIP712RevocationParams, signer: Signer): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationParams>>;
    verifyDelegatedRevocationSignature(revoker: string, response: EIP712Response<EIP712MessageTypes, EIP712RevocationParams>): boolean;
}
