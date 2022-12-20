import { Base, SignerOrProvider } from './base';
import { EAS as EASContract } from '@ethereum-attestation-service/eas-contracts';
import { BigNumberish, BytesLike, ContractTransaction, Signature } from 'ethers';
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
    value?: BigNumberish;
}
export interface AttestParamsByDelegation extends AttestParams {
    attester: string;
    signature: Signature;
    value?: BigNumberish;
}
export interface RevokeParams {
    uuid: string;
    value?: BigNumberish;
}
export interface RevokeByDelegationParams extends RevokeParams {
    attester: string;
    signature: Signature;
    value?: BigNumberish;
}
export interface GetAttestationParams {
    uuid: string;
}
export interface IsAttestationValidParams {
    uuid: string;
}
export interface IsAttestationRevokedParams {
    uuid: string;
}
export declare class EAS extends Base<EASContract> {
    constructor(address: string, signerOrProvider?: SignerOrProvider);
    attest({ recipient, schema, data, expirationTime, revocable, refUUID, value }: AttestParams): Promise<string>;
    attestByDelegation({ recipient, schema, data, attester, signature, expirationTime, revocable, refUUID, value }: AttestParamsByDelegation): Promise<string>;
    revoke({ uuid, value }: RevokeParams): Promise<ContractTransaction>;
    revokeByDelegation({ uuid, attester, signature, value }: RevokeByDelegationParams): Promise<ContractTransaction>;
    getAttestation({ uuid }: GetAttestationParams): Promise<Attestation>;
    isAttestationValid({ uuid }: IsAttestationValidParams): Promise<boolean>;
    isAttestationRevoked({ uuid }: IsAttestationRevokedParams): Promise<boolean>;
}
