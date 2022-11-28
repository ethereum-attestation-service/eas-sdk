import { DomainTypedData, EIP712MessageTypes, EIP712Params, EIP712Request, EIP712TypedData, TypedData, TypedDataConfig, TypedDataHandler } from './typed-data-handler';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
export { EIP712Request } from './typed-data-handler';
export declare const ATTESTATION_PRIMARY_TYPE = "Attestation";
export declare const ATTESTATION_TYPE: TypedData[];
export declare const DOMAIN_NAME = "EAS Attestation";
export interface SignedOffchainAttestation extends EIP712Request {
    uuid: string;
}
export type OffchainAttestationParams = {
    schema: string;
    recipient: string;
    time: number;
    expirationTime: number;
    revocable: boolean;
    refUUID: string;
    data: string;
} & Partial<EIP712Params>;
export declare class Offchain extends TypedDataHandler {
    constructor(config: TypedDataConfig);
    getDomainSeparator(): string;
    getDomainTypedData(): DomainTypedData;
    getTypedData(_type: string, params: EIP712Params): EIP712TypedData<EIP712MessageTypes>;
    signOffchainAttestation(params: OffchainAttestationParams, signer: TypedDataSigner): Promise<SignedOffchainAttestation>;
    verifyOffchainAttestationSignature(attester: string, request: SignedOffchainAttestation): Promise<boolean>;
}
