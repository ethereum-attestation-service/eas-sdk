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
  attester: string;
  data: string;
}

export const NO_EXPIRATION = 0;

export class EAS extends Base<EASContract> {
  constructor(address: string) {
    super(new EAS__factory(), address);
  }

  // Attests to a specific schema
  public async attest(
    recipient: string,
    schema: string,
    data: BytesLike,
    expirationTime: number = NO_EXPIRATION,
    _revocable = true,
    refUUID: string = ZERO_BYTES32,
    overrides: PayableOverrides = {}
  ) {
    // TODO: revocable
    const res = await this.contract.attest(recipient, schema, expirationTime, refUUID, data, overrides);
    const receipt = await res.wait();

    const event = receipt.events?.find((e) => e.event === 'Attested');
    if (!event) {
      throw new Error('Unable to process attestation event');
    }

    return event.args?.uuid;
  }

  // Attests to a specific schema via an EIP712 delegation request
  public async attestByDelegation(
    recipient: string,
    schema: string,
    data: BytesLike,
    attester: string,
    signature: Signature,
    expirationTime: number = NO_EXPIRATION,
    _revocable = true,
    refUUID: string = ZERO_BYTES32,
    overrides: PayableOverrides = {}
  ) {
    // TODO: revocable
    const res = await this.contract.attestByDelegation(
      recipient,
      schema,
      expirationTime,
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
  revoke(uuid: string) {
    return this.contract.revoke(uuid);
  }

  // Revokes an existing attestation an EIP712 delegation request
  revokeByDelegation(uuid: string, attester: string, signature: Signature) {
    return this.contract.revokeByDelegation(uuid, attester, signature.v, hexlify(signature.r), hexlify(signature.s));
  }

  // Returns an existing schema by attestation UUID
  getAttestation(uuid: string): Promise<Attestation> {
    return this.contract.getAttestation(uuid);
  }

  // Returns whether an attestation is valid
  isAttestationValid(uuid: string): Promise<boolean> {
    return this.contract.isAttestationValid(uuid);
  }
}
