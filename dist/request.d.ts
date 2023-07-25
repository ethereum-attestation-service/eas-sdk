import { Signature } from './offchain/typed-data-handler';
export declare const NO_EXPIRATION = 0n;
export interface AttestationRequestData {
    recipient: string;
    data: string;
    expirationTime?: bigint;
    revocable?: boolean;
    refUID?: string;
    value?: bigint;
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
    value?: bigint;
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
    deadline: bigint;
}
export interface MultiDelegatedProxyAttestationRequest extends MultiDelegatedAttestationRequest {
    deadline: bigint;
}
export interface DelegatedProxyRevocationRequest extends DelegatedRevocationRequest {
    deadline: bigint;
}
export interface MultiDelegatedProxyRevocationRequest extends MultiDelegatedRevocationRequest {
    deadline: bigint;
}
