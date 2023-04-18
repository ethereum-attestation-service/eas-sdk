import { Signature } from './offchain/typed-data-handler';
import { Base, SignerOrProvider, Transaction } from './transaction';
import { EAS as EASContract } from '@ethereum-attestation-service/eas-contracts';
import { BigNumber, BigNumberish } from 'ethers';
export interface Attestation {
    uid: string;
    schema: string;
    refUID: string;
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
    refUID?: string;
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
    uid: string;
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
export interface DelegatedProxyAttestationRequest extends DelegatedAttestationRequest {
    deadline: BigNumberish;
}
export interface MultiDelegatedProxyAttestationRequest extends MultiDelegatedAttestationRequest {
    deadline: BigNumberish;
}
export interface DelegatedProxyRevocationRequest extends DelegatedRevocationRequest {
    deadline: BigNumberish;
}
export interface MultiDelegatedProxyRevocationRequest extends MultiDelegatedRevocationRequest {
    deadline: BigNumberish;
}
export interface EASOptions {
    signerOrProvider?: SignerOrProvider;
    proxy?: string;
}
export declare class EAS extends Base<EASContract> {
    private proxy?;
    constructor(address: string, options?: EASOptions);
    getVersion(): Promise<string>;
    getAttestation(uid: string): Promise<Attestation>;
    isAttestationValid(uid: string): Promise<boolean>;
    isAttestationRevoked(uid: string): Promise<boolean>;
    getTimestamp(data: string): Promise<BigNumberish>;
    getRevocationOffchain(user: string, uid: string): Promise<BigNumberish>;
    attest({ schema, data: { recipient, data, expirationTime, revocable, refUID, value } }: AttestationRequest): Promise<Transaction<string>>;
    attestByDelegation({ schema, data: { recipient, data, expirationTime, revocable, refUID, value }, attester, signature }: DelegatedAttestationRequest): Promise<Transaction<string>>;
    multiAttest(requests: MultiAttestationRequest[]): Promise<Transaction<string[]>>;
    multiAttestByDelegation(requests: MultiDelegatedAttestationRequest[]): Promise<Transaction<string[]>>;
    revoke({ schema, data: { uid, value } }: RevocationRequest): Promise<Transaction<void>>;
    revokeByDelegation({ schema, data: { uid, value }, signature, revoker }: DelegatedRevocationRequest): Promise<Transaction<void>>;
    multiRevoke(requests: MultiRevocationRequest[]): Promise<Transaction<void>>;
    multiRevokeByDelegation(requests: MultiDelegatedRevocationRequest[]): Promise<Transaction<void>>;
    attestByDelegationProxy({ schema, data: { recipient, data, expirationTime, revocable, refUID, value }, attester, signature, deadline }: DelegatedProxyAttestationRequest): Promise<Transaction<string>>;
    multiAttestByDelegationProxy(requests: MultiDelegatedProxyAttestationRequest[]): Promise<Transaction<string[]>>;
    revokeByDelegationProxy({ schema, data: { uid, value }, signature, revoker, deadline }: DelegatedProxyRevocationRequest): Promise<Transaction<void>>;
    multiRevokeByDelegationProxy(requests: MultiDelegatedProxyRevocationRequest[]): Promise<Transaction<void>>;
    timestamp(data: string): Promise<Transaction<BigNumberish>>;
    multiTimestamp(data: string[]): Promise<Transaction<BigNumberish[]>>;
    revokeOffchain(uid: string): Promise<Transaction<BigNumberish>>;
    multiRevokeOffchain(uids: string[]): Promise<Transaction<BigNumberish[]>>;
    getDomainSeparator(): Promise<string>;
    getNonce(address: string): Promise<BigNumber>;
    getAttestTypeHash(): Promise<string>;
    getRevokeTypeHash(): Promise<string>;
}
