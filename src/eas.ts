import { Base, SignerOrProvider } from './base';
import { getUUIDFromAttestTx, getUUIDFromMultiAttestTx, ZERO_BYTES32 } from './utils';
import { EAS__factory, EAS as EASContract } from '@ethereum-attestation-service/eas-contracts';
import { BigNumber, BigNumberish, ContractTransaction, Signature } from 'ethers';

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
  expirationTime?: number;
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

export class EAS extends Base<EASContract> {
  constructor(address: string, signerOrProvider?: SignerOrProvider) {
    super(new EAS__factory(), address, signerOrProvider);
  }

  // Returns an existing schema by attestation UUID
  public async getAttestation({ uuid }: GetAttestationParams): Promise<Attestation> {
    return this.contract.getAttestation(uuid);
  }

  // Returns whether an attestation is valid
  public async isAttestationValid({ uuid }: IsAttestationValidParams): Promise<boolean> {
    return this.contract.isAttestationValid(uuid);
  }

  // Returns whether an attestation has been revoked
  public async isAttestationRevoked({ uuid }: IsAttestationRevokedParams): Promise<boolean> {
    const attestation = await this.contract.getAttestation(uuid);
    if (attestation.uuid === ZERO_BYTES32) {
      throw new Error('Invalid attestation');
    }

    return attestation.revocationTime != 0;
  }

  // Attests to a specific schema
  public async attest({
    schema,
    data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUUID = ZERO_BYTES32, value = 0 }
  }: AttestationRequest): Promise<string> {
    const res = await this.contract.attest(
      { schema, data: { recipient, expirationTime, revocable, refUUID, data, value } },
      {
        value
      }
    );

    return getUUIDFromAttestTx(res);
  }

  // Attests to a specific schema via an EIP712 delegation request
  public async attestByDelegation({
    schema,
    data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUUID = ZERO_BYTES32, value = 0 },
    attester,
    signature
  }: DelegatedAttestationRequest): Promise<string> {
    const res = await this.contract.attestByDelegation(
      {
        schema,
        data: {
          recipient,
          expirationTime,
          revocable,
          refUUID,
          data,
          value
        },
        signature,
        attester
      },
      { value }
    );

    return getUUIDFromAttestTx(res);
  }

  // Multi-attests to multiple schemas
  public async multiAttest(requests: MultiAttestationRequest[]): Promise<string[]> {
    const multiAttestationRequests = requests.map((r) => ({
      schema: r.schema,
      data: r.data.map((d) => ({
        recipient: d.recipient,
        expirationTime: d.expirationTime ?? NO_EXPIRATION,
        revocable: d.revocable ?? true,
        refUUID: d.refUUID ?? ZERO_BYTES32,
        data: d.data ?? ZERO_BYTES32,
        value: d.value ?? 0
      }))
    }));

    const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
      const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
      return res.add(total);
    }, BigNumber.from(0));

    const res = await this.contract.multiAttest(multiAttestationRequests, {
      value: requestedValue
    });

    return getUUIDFromMultiAttestTx(res);
  }

  // Multi-attests to multiple schemas via an EIP712 delegation requests
  public async multiAttestByDelegation(requests: MultiDelegatedAttestationRequest[]): Promise<string[]> {
    const multiAttestationRequests = requests.map((r) => ({
      schema: r.schema,
      data: r.data.map((d) => ({
        recipient: d.recipient,
        expirationTime: d.expirationTime ?? NO_EXPIRATION,
        revocable: d.revocable ?? true,
        refUUID: d.refUUID ?? ZERO_BYTES32,
        data: d.data ?? ZERO_BYTES32,
        value: d.value ?? 0
      })),
      signatures: r.signatures,
      attester: r.attester
    }));

    const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
      const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
      return res.add(total);
    }, BigNumber.from(0));

    const res = await this.contract.multiAttestByDelegation(multiAttestationRequests, {
      value: requestedValue
    });

    return getUUIDFromMultiAttestTx(res);
  }

  // Revokes an existing attestation
  public async revoke({ schema, data: { uuid, value = 0 } }: RevocationRequest): Promise<ContractTransaction> {
    return this.contract.revoke({ schema, data: { uuid, value } }, { value });
  }

  // Revokes an existing attestation an EIP712 delegation request
  public async revokeByDelegation({
    schema,
    data: { uuid, value = 0 },
    signature,
    revoker
  }: DelegatedRevocationRequest): Promise<ContractTransaction> {
    return this.contract.revokeByDelegation(
      {
        schema,
        data: {
          uuid,
          value
        },
        signature,
        revoker
      },
      { value }
    );
  }

  // Multi-revokes multiple attestations
  public async multiRevoke(requests: MultiRevocationRequest[]): Promise<ContractTransaction> {
    const multiRevocationRequests = requests.map((r) => ({
      schema: r.schema,
      data: r.data.map((d) => ({
        uuid: d.uuid,
        value: d.value ?? 0
      }))
    }));

    const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
      const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
      return res.add(total);
    }, BigNumber.from(0));

    return this.contract.multiRevoke(multiRevocationRequests, {
      value: requestedValue
    });
  }

  // Multi-revokes multiple attestations via an EIP712 delegation requests
  public async multiRevokeByDelegation(requests: MultiDelegatedRevocationRequest[]): Promise<ContractTransaction> {
    const multiRevocationRequests = requests.map((r) => ({
      schema: r.schema,
      data: r.data.map((d) => ({
        uuid: d.uuid,
        value: d.value ?? 0
      })),
      signatures: r.signatures,
      revoker: r.revoker
    }));

    const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
      const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
      return res.add(total);
    }, BigNumber.from(0));

    return this.contract.multiRevokeByDelegation(multiRevocationRequests, {
      value: requestedValue
    });
  }
}
