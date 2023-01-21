import { DomainTypedData, EIP712MessageTypes, EIP712Params, EIP712Request, TypedData, TypedDataConfig, TypedDataHandler } from './typed-data-handler';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { BigNumberish } from 'ethers';
export { EIP712Request, TypedDataConfig, EIP712MessageTypes } from './typed-data-handler';
export { TypedDataSigner } from '@ethersproject/abstract-signer';
export declare const ATTESTATION_PRIMARY_TYPE = "Attestation";
export declare const ATTESTATION_TYPE: TypedData[];
export declare const DOMAIN_NAME = "EAS Attestation";
export type OffchainAttestationParams = {
    schema: string;
    recipient: string;
    time: BigNumberish;
    expirationTime: BigNumberish;
    revocable: boolean;
    refUUID: string;
    data: string;
} & Partial<EIP712Params>;
export interface SignedOffchainAttestation extends EIP712Request<EIP712MessageTypes, OffchainAttestationParams> {
    uuid: string;
}
export declare class Offchain extends TypedDataHandler {
    constructor(config: TypedDataConfig);
    getDomainSeparator(): string;
    getDomainTypedData(): DomainTypedData;
    signOffchainAttestation(params: OffchainAttestationParams, signer: TypedDataSigner): Promise<SignedOffchainAttestation>;
    verifyOffchainAttestationSignature(attester: string, request: SignedOffchainAttestation): boolean;
    static getOffchainUUID(params: OffchainAttestationParams): string;
}
