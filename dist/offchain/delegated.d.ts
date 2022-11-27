/// <reference types="node" />
import { DomainTypedData, EIP712MessageTypes, EIP712Params, EIP712Request, EIP712TypedData, TypedData, TypedDataConfig, TypedDataHandler } from './typed-data-handler';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
export { EIP712MessageTypes, EIP712TypedData, EIP712Request } from './typed-data-handler';
export declare const ATTEST_PRIMARY_TYPE = "Attest";
export declare const REVOKE_PRIMARY_TYPE = "Revoke";
export declare const ATTEST_TYPE: TypedData[];
export declare const REVOKE_TYPE: TypedData[];
export declare const EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
export declare const EIP712_NAME = "EAS";
export type EIP712AttestationParams = EIP712Params & {
    recipient: string;
    schema: string;
    expirationTime: number;
    refUUID: string;
    data: Buffer;
};
export type EIP712RevocationParams = EIP712Params & {
    uuid: string;
};
export declare class Delegated extends TypedDataHandler {
    constructor(config: TypedDataConfig);
    getDomainSeparator(): string;
    getDomainTypedData(): DomainTypedData;
    getTypedData(type: string, params: EIP712Params): EIP712TypedData<EIP712MessageTypes>;
    signDelegatedAttestation(params: EIP712AttestationParams, signer: TypedDataSigner): Promise<EIP712Request>;
    verifyDelegatedAttestationSignature(attester: string, request: EIP712Request): Promise<boolean>;
    signDelegatedRevocation(params: EIP712RevocationParams, signer: TypedDataSigner): Promise<EIP712Request>;
    verifyDelegatedRevocationSignature(attester: string, request: EIP712Request): Promise<boolean>;
}
