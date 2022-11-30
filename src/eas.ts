import { Base } from './base';
import { ZERO_BYTES32 } from './utils';
import { EAS__factory, EAS as EASContract } from '@ethereum-attestation-service/eas-contracts';
import { BytesLike, PayableOverrides, Signature, utils } from 'ethers';

const { hexlify } = utils;

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

export const NO_EXPIRATION = 0;

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

export class EAS extends Base<EASContract> {
  constructor(address: string) {
    super(new EAS__factory(), address);
  }

  // Attests to a specific schema
  public async attest({
    recipient,
    schema,
    data,
    expirationTime = NO_EXPIRATION,
    revocable = true,
    refUUID = ZERO_BYTES32,
    overrides = { value: 0 }
  }: AttestParams) {
    const res = await this.contract.attest(recipient, schema, expirationTime, revocable, refUUID, data, overrides);

    const receipt = await res.wait();

    const event = receipt.events?.find((e) => e.event === 'Attested');
    if (!event) {
      throw new Error('Unable to process attestation event');
    }

    return event.args?.uuid;
  }

  // Attests to a specific schema via an EIP712 delegation request
  public async attestByDelegation({
    recipient,
    schema,
    data,
    attester,
    signature,
    expirationTime = NO_EXPIRATION,
    revocable = true,
    refUUID = ZERO_BYTES32,
    overrides = {}
  }: AttestParamsByDelegation) {
    const res = await this.contract.attestByDelegation(
      recipient,
      schema,
      expirationTime,
      revocable,
      refUUID,
      data,
      attester,
      signature.v,
      hexlify(signature.r),
      hexlify(signature.s),
      overrides
    );
    const receipt = await res.wait();

    const event = receipt.events?.find((e) => e.event === 'Attested');
    if (!event) {
      throw new Error('Unable to process attestation event');
    }

    return event.args?.uuid;
  }

  // Revokes an existing attestation
  revoke({ uuid, overrides = {} }: RevokeParams) {
    return this.contract.revoke(uuid, overrides);
  }

  // Revokes an existing attestation an EIP712 delegation request
  revokeByDelegation({ uuid, attester, signature, overrides = {} }: RevokeByDelegationParams) {
    return this.contract.revokeByDelegation(
      uuid,
      attester,
      signature.v,
      hexlify(signature.r),
      hexlify(signature.s),
      overrides
    );
  }

  // Returns an existing schema by attestation UUID
  getAttestation({ uuid }: GetAttestationParams): Promise<Attestation> {
    return this.contract.getAttestation(uuid);
  }

  // Returns whether an attestation is valid
  isAttestationValid({ uuid }: IsAttestationValidParams): Promise<boolean> {
    return this.contract.isAttestationValid(uuid);
  }
}
