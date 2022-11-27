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
    attester: string;
    data: string;
}
export declare const NO_EXPIRATION = 0;
export declare class EAS extends Base<EASContract> {
    constructor(address: string);
    attest(recipient: string, schema: string, data: BytesLike, expirationTime?: number, refUUID?: string, overrides?: PayableOverrides): Promise<any>;
    attestByDelegation(recipient: string, schema: string, data: BytesLike, attester: string, signature: Signature, expirationTime?: number, refUUID?: string, overrides?: PayableOverrides): Promise<any>;
    revoke(uuid: string): Promise<import("ethers").ContractTransaction>;
    revokeByDelegation(uuid: string, attester: string, signature: Signature): Promise<import("ethers").ContractTransaction>;
    getAttestation(uuid: string): Promise<Attestation>;
    isAttestationValid(uuid: string): Promise<boolean>;
}
