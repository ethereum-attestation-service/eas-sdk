import { EAS } from '../eas';
import { EIP712MessageTypes, EIP712Params, EIP712Response, TypeDataSigner, TypedDataHandler } from './typed-data-handler';
export { EIP712MessageTypes, EIP712TypedData, EIP712Request, EIP712Response, Signature } from './typed-data-handler';
declare enum DelegatedAttestationVersion {
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
interface DelegatedConfig {
    address: string;
    chainId: bigint;
    version?: string;
    domainSeparator?: string;
}
export declare class Delegated extends TypedDataHandler {
    readonly version: DelegatedAttestationVersion;
    private readonly attestType;
    private readonly revokeType;
    private readonly eas;
    constructor(config: DelegatedConfig, eas: EAS);
    signDelegatedAttestation(params: EIP712AttestationParams, signer: TypeDataSigner): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationParams>>;
    verifyDelegatedAttestationSignature(attester: string, response: EIP712Response<EIP712MessageTypes, EIP712AttestationParams>): boolean;
    signDelegatedRevocation(params: EIP712RevocationParams, signer: TypeDataSigner): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationParams>>;
    verifyDelegatedRevocationSignature(revoker: string, response: EIP712Response<EIP712MessageTypes, EIP712RevocationParams>): boolean;
}
