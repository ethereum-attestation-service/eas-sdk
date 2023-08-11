import { Signer } from 'ethers';
import { DomainTypedData, EIP712MessageTypes, EIP712Params, EIP712Response, PartialTypedDataConfig, TypedData, TypedDataHandler } from './typed-data-handler';
export { EIP712Request, PartialTypedDataConfig, EIP712MessageTypes } from './typed-data-handler';
interface OffchainAttestationType {
    domainName: string;
    primaryType: string;
    types: TypedData[];
}
export declare const OFFCHAIN_ATTESTATION_VERSION = 1;
export declare const OFFCHAIN_ATTESTATION_TYPES: Record<number, OffchainAttestationType>;
export type OffchainAttestationParams = {
    version: number;
    schema: string;
    recipient: string;
    time: bigint;
    expirationTime: bigint;
    revocable: boolean;
    refUID: string;
    data: string;
} & Partial<EIP712Params>;
export interface SignedOffchainAttestation extends EIP712Response<EIP712MessageTypes, OffchainAttestationParams> {
    uid: string;
}
export declare class Offchain extends TypedDataHandler {
    readonly version: number;
    private readonly type;
    constructor(config: PartialTypedDataConfig, version: number);
    getDomainSeparator(): string;
    getDomainTypedData(): DomainTypedData;
    signOffchainAttestation(params: OffchainAttestationParams, signer: Signer): Promise<SignedOffchainAttestation>;
    verifyOffchainAttestationSignature(attester: string, request: SignedOffchainAttestation): boolean;
    static getOffchainUID(params: OffchainAttestationParams): string;
}
