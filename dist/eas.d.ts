import { Base, SignerOrProvider, Transaction } from './transaction';
import { EAS as EASContract } from '@ethereum-attestation-service/eas-contracts';
import { BigNumber, BigNumberish, Signature } from 'ethers';
export interface Attestation {
    uuid: string;
    schema: string;
    refUUID: string;
    time: BigNumberish;
    expirationTime: BigNumberish;
    revocationTime: BigNumberish;
    recipient: string;
    revocable: boolean;
    attester: string;
    data: string;
}
export declare const NO_EXPIRATION = 0;
export interface AttestationRequestData {
    recipient: string;
    data: string;
    expirationTime?: BigNumberish;
    revocable?: boolean;
    refUUID?: string;
    value?: BigNumberish;
}
export interface AttestationRequest {
    schema: string;
    data: AttestationRequestData;
}
export interface DelegatedAttestationRequest extends AttestationRequest {
    signature: Signature;
    attester: string;
}
export interface MultiAttestationRequest {
    schema: string;
    data: AttestationRequestData[];
}
export interface MultiDelegatedAttestationRequest extends MultiAttestationRequest {
    signatures: Signature[];
    attester: string;
}
export interface RevocationRequestData {
    uuid: string;
    value?: BigNumberish;
}
export interface RevocationRequest {
    schema: string;
    data: RevocationRequestData;
}
export interface DelegatedRevocationRequest extends RevocationRequest {
    signature: Signature;
    revoker: string;
}
export interface MultiRevocationRequest {
    schema: string;
    data: RevocationRequestData[];
}
export interface MultiDelegatedRevocationRequest extends MultiRevocationRequest {
    signatures: Signature[];
    revoker: string;
}
export declare class EAS extends Base<EASContract> {
    constructor(address: string, signerOrProvider?: SignerOrProvider);
    getVersion(): Promise<string>;
    getAttestation(uuid: string): Promise<Attestation>;
    isAttestationValid(uuid: string): Promise<boolean>;
    isAttestationRevoked(uuid: string): Promise<boolean>;
    getTimestamp(data: string): Promise<BigNumberish>;
    attest({ schema, data: { recipient, data, expirationTime, revocable, refUUID, value } }: AttestationRequest): Promise<Transaction<string>>;
    attestByDelegation({ schema, data: { recipient, data, expirationTime, revocable, refUUID, value }, attester, signature }: DelegatedAttestationRequest): Promise<Transaction<string>>;
    multiAttest(requests: MultiAttestationRequest[]): Promise<Transaction<string[]>>;
    multiAttestByDelegation(requests: MultiDelegatedAttestationRequest[]): Promise<Transaction<string[]>>;
    revoke({ schema, data: { uuid, value } }: RevocationRequest): Promise<Transaction<void>>;
    revokeByDelegation({ schema, data: { uuid, value }, signature, revoker }: DelegatedRevocationRequest): Promise<Transaction<void>>;
    multiRevoke(requests: MultiRevocationRequest[]): Promise<Transaction<void>>;
    multiRevokeByDelegation(requests: MultiDelegatedRevocationRequest[]): Promise<Transaction<void>>;
    timestamp(data: string): Promise<Transaction<BigNumberish>>;
    multiTimestamp(data: string[]): Promise<Transaction<BigNumberish[]>>;
    getDomainSeparator(): Promise<string>;
    getNonce(address: string): Promise<BigNumber>;
    getAttestTypeHash(): Promise<string>;
    getRevokeTypeHash(): Promise<string>;
}
