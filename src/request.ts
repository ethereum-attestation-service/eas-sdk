import { Signature } from './offchain/typed-data-handler';

export const NO_EXPIRATION = 0n;

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
  deadline?: bigint;
}

export interface MultiAttestationRequest {
  schema: string;
  data: AttestationRequestData[];
}

export interface MultiDelegatedAttestationRequest extends MultiAttestationRequest {
  signatures: Signature[];
  attester: string;
  deadline?: bigint;
}

export interface RevocationRequestData {
  uid: string;
  value?: bigint;
}

export interface RevocationRequest {
  schema: string;
  data: RevocationRequestData;
}

export interface OffchainRevocationRequest {
  schema: string;
  data: RevocationRequestData;
}

export interface DelegatedRevocationRequest extends RevocationRequest {
  signature: Signature;
  revoker: string;
  deadline?: bigint;
}

export interface MultiRevocationRequest {
  schema: string;
  data: RevocationRequestData[];
}

export interface MultiDelegatedRevocationRequest extends MultiRevocationRequest {
  signatures: Signature[];
  revoker: string;
  deadline?: bigint;
}

export type DelegatedProxyAttestationRequest = DelegatedAttestationRequest;
export type MultiDelegatedProxyAttestationRequest = MultiDelegatedAttestationRequest;
export type DelegatedProxyRevocationRequest = DelegatedRevocationRequest;
export type MultiDelegatedProxyRevocationRequest = MultiDelegatedRevocationRequest;
