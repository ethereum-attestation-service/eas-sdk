import { Signature } from './offchain/typed-data-handler';
import { BigNumberish } from 'ethers';
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
