import { Base } from './base';
import { EAS as EASContract } from '@ethereum-attestation-service/eas-contracts';
import { BytesLike, PayableOverrides, Signature } from 'ethers';
export interface Attestation {
    uuid: string;
    schema: string;
    refUUID: string;
    time: number;
    expirationTime: number;
    revocationTime: number;
    recipient: string;
    revocable: boolean;
    attester: string;
    data: string;
}
export declare const NO_EXPIRATION = 0;
export interface AttestParams {
    recipient: string;
    schema: string;
    data: BytesLike;
    expirationTime?: number;
    revocable?: boolean;
    refUUID?: string;
    overrides?: PayableOverrides;
}
export interface AttestParamsByDelegation extends AttestParams {
    attester: string;
    signature: Signature;
}
export interface RevokeParams {
    uuid: string;
    overrides?: PayableOverrides;
}
export interface RevokeByDelegationParams extends RevokeParams {
    attester: string;
    signature: Signature;
}
export interface GetAttestationParams {
    uuid: string;
}
export interface IsAttestationValidParams {
    uuid: string;
}
export declare class EAS extends Base<EASContract> {
    constructor(address: string);
    attest({ recipient, schema, data, expirationTime, revocable, refUUID, overrides }: AttestParams): Promise<any>;
    attestByDelegation({ recipient, schema, data, attester, signature, expirationTime, revocable, refUUID, overrides }: AttestParamsByDelegation): Promise<any>;
    revoke({ uuid, overrides }: RevokeParams): Promise<import("ethers").ContractTransaction>;
    revokeByDelegation({ uuid, attester, signature, overrides }: RevokeByDelegationParams): Promise<import("ethers").ContractTransaction>;
    getAttestation({ uuid }: GetAttestationParams): Promise<Attestation>;
    isAttestationValid({ uuid }: IsAttestationValidParams): Promise<boolean>;
}
