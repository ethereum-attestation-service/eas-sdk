import { Base, SignerOrProvider, Transaction } from './base';
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
export interface GetAttestationParams {
    uuid: string;
}
export interface IsAttestationValidParams {
    uuid: string;
}
export interface IsAttestationRevokedParams {
    uuid: string;
}
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
    getAttestation({ uuid }: GetAttestationParams): Promise<Attestation>;
    isAttestationValid({ uuid }: IsAttestationValidParams): Promise<boolean>;
    isAttestationRevoked({ uuid }: IsAttestationRevokedParams): Promise<boolean>;
    attest({ schema, data: { recipient, data, expirationTime, revocable, refUUID, value } }: AttestationRequest): Transaction<string>;
    attestByDelegation({ schema, data: { recipient, data, expirationTime, revocable, refUUID, value }, attester, signature }: DelegatedAttestationRequest): Transaction<string>;
    multiAttest(requests: MultiAttestationRequest[]): Transaction<string[]>;
    multiAttestByDelegation(requests: MultiDelegatedAttestationRequest[]): Transaction<string[]>;
    revoke({ schema, data: { uuid, value } }: RevocationRequest): Transaction<void>;
    revokeByDelegation({ schema, data: { uuid, value }, signature, revoker }: DelegatedRevocationRequest): Transaction<void>;
    multiRevoke(requests: MultiRevocationRequest[]): Transaction<void>;
    multiRevokeByDelegation(requests: MultiDelegatedRevocationRequest[]): Transaction<void>;
    getDomainSeparator(): Promise<string>;
    getNonce(address: string): Promise<BigNumber>;
    getAttestTypeHash(): Promise<string>;
    getRevokeTypeHash(): Promise<string>;
}
