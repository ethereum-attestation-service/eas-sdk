import { Signer } from 'ethers';
import { EAS } from '../eas';
import { DomainTypedData, EIP712MessageTypes, EIP712Params, EIP712Response, EIP712Types, PartialTypedDataConfig, TypedDataHandler } from './typed-data-handler';
export { EIP712Request, PartialTypedDataConfig, EIP712MessageTypes } from './typed-data-handler';
interface OffchainAttestationType extends EIP712Types<EIP712MessageTypes> {
    domain: string;
}
export declare enum OffChainAttestationVersion {
    Legacy = 0,
    Version1 = 1
}
export declare const OFFCHAIN_ATTESTATION_TYPES: Record<OffChainAttestationVersion, OffchainAttestationType>;
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
export type OffchainAttestationOptions = {
    verifyOnchain: boolean;
};
export interface SignedOffchainAttestation extends EIP712Response<EIP712MessageTypes, OffchainAttestationParams> {
    uid: string;
}
export declare class Offchain extends TypedDataHandler {
    readonly version: OffChainAttestationVersion;
    private readonly type;
    private readonly eas;
    constructor(config: PartialTypedDataConfig, version: number, eas: EAS);
    getDomainSeparator(): string;
    getDomainTypedData(): DomainTypedData;
    signOffchainAttestation(params: OffchainAttestationParams, signer: Signer, options?: OffchainAttestationOptions): Promise<SignedOffchainAttestation>;
    verifyOffchainAttestationSignature(attester: string, request: SignedOffchainAttestation): boolean;
    static getOffchainUID(params: OffchainAttestationParams): string;
}
