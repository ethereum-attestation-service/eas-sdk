import { Base, SignerOrProvider, Transaction } from './transaction';
import { getTimestampFromTimestampEvents, getUUIDsFromAttestEvents, ZERO_BYTES32 } from './utils';
import { EAS__factory, EAS as EASContract } from '@ethereum-attestation-service/eas-contracts';
import { BigNumber, BigNumberish, ContractReceipt, Signature } from 'ethers';

export interface Attestation {
  uuid: string;
  schema: string;
  refUUID: string;
  time: BigNumberish;
  expirationTime: BigNumberish;
  revocationTime: BigNumberish;
  recipient: string;
  revocable: boolean;
  attester: string;
  data: string;
}

export const NO_EXPIRATION = 0;

export interface AttestationRequestData {
  recipient: string;
  data: string;
  expirationTime?: BigNumberish;
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

  // Returns the version of the contract
  public getVersion(): Promise<string> {
    return this.contract.VERSION();
  }

  // Returns an existing schema by attestation UUID
  public getAttestation(uuid: string): Promise<Attestation> {
    return this.contract.getAttestation(uuid);
  }

  // Returns whether an attestation is valid
  public isAttestationValid(uuid: string): Promise<boolean> {
    return this.contract.isAttestationValid(uuid);
  }

  // Returns whether an attestation has been revoked
  public async isAttestationRevoked(uuid: string): Promise<boolean> {
    const attestation = await this.contract.getAttestation(uuid);
    if (attestation.uuid === ZERO_BYTES32) {
      throw new Error('Invalid attestation');
    }

    return !attestation.revocationTime.isZero();
  }

  // Returns the timestamp that the specified data was timestamped with.
  public getTimestamp(data: string): Promise<BigNumberish> {
    return this.contract.getTimestamp(data);
  }

  // Attests to a specific schema
  public async attest({
    schema,
    data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUUID = ZERO_BYTES32, value = 0 }
  }: AttestationRequest): Promise<Transaction<string>> {
    const tx = await this.contract.attest(
      { schema, data: { recipient, expirationTime, revocable, refUUID, data, value } },
      {
        value
      }
    );

    return new Transaction(tx, async (receipt: ContractReceipt) => (await getUUIDsFromAttestEvents(receipt.events))[0]);
  }

  // Attests to a specific schema via an EIP712 delegation request
  public async attestByDelegation({
    schema,
    data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUUID = ZERO_BYTES32, value = 0 },
    attester,
    signature
  }: DelegatedAttestationRequest): Promise<Transaction<string>> {
    const tx = await this.contract.attestByDelegation(
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

    return new Transaction(tx, async (receipt: ContractReceipt) => (await getUUIDsFromAttestEvents(receipt.events))[0]);
  }

  // Multi-attests to multiple schemas
  public async multiAttest(requests: MultiAttestationRequest[]): Promise<Transaction<string[]>> {
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

    const tx = await this.contract.multiAttest(multiAttestationRequests, {
      value: requestedValue
    });

    // eslint-disable-next-line require-await
    return new Transaction(tx, async (receipt: ContractReceipt) => getUUIDsFromAttestEvents(receipt.events));
  }

  // Multi-attests to multiple schemas via an EIP712 delegation requests
  public async multiAttestByDelegation(requests: MultiDelegatedAttestationRequest[]): Promise<Transaction<string[]>> {
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

    const tx = await this.contract.multiAttestByDelegation(multiAttestationRequests, {
      value: requestedValue
    });

    // eslint-disable-next-line require-await
    return new Transaction(tx, async (receipt: ContractReceipt) => getUUIDsFromAttestEvents(receipt.events));
  }

  // Revokes an existing attestation
  public async revoke({ schema, data: { uuid, value = 0 } }: RevocationRequest): Promise<Transaction<void>> {
    const tx = await this.contract.revoke({ schema, data: { uuid, value } }, { value });

    return new Transaction(tx, async () => {});
  }

  // Revokes an existing attestation an EIP712 delegation request
  public async revokeByDelegation({
    schema,
    data: { uuid, value = 0 },
    signature,
    revoker
  }: DelegatedRevocationRequest): Promise<Transaction<void>> {
    const tx = await this.contract.revokeByDelegation(
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

    return new Transaction(tx, async () => {});
  }

  // Multi-revokes multiple attestations
  public async multiRevoke(requests: MultiRevocationRequest[]): Promise<Transaction<void>> {
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

    const tx = await this.contract.multiRevoke(multiRevocationRequests, {
      value: requestedValue
    });

    return new Transaction(tx, async () => {});
  }

  // Multi-revokes multiple attestations via an EIP712 delegation requests
  public async multiRevokeByDelegation(requests: MultiDelegatedRevocationRequest[]): Promise<Transaction<void>> {
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

    const tx = await this.contract.multiRevokeByDelegation(multiRevocationRequests, {
      value: requestedValue
    });

    return new Transaction(tx, async () => {});
  }

  // Timestamps the specified bytes32 data.
  public async timestamp(data: string): Promise<Transaction<BigNumberish>> {
    const tx = await this.contract.timestamp(data);

    return new Transaction(
      tx,
      async (receipt: ContractReceipt) => (await getTimestampFromTimestampEvents(receipt.events))[0]
    );
  }

  // Timestamps the specified multiple bytes32 data.
  public async multiTimestamp(data: string[]): Promise<Transaction<BigNumberish[]>> {
    const tx = await this.contract.multiTimestamp(data);

    // eslint-disable-next-line require-await
    return new Transaction(tx, async (receipt: ContractReceipt) => getTimestampFromTimestampEvents(receipt.events));
  }

  // Returns the domain separator used in the encoding of the signatures for attest, and revoke.
  public getDomainSeparator(): Promise<string> {
    return this.contract.getDomainSeparator();
  }

  // Returns the current nonce per-account.
  public getNonce(address: string): Promise<BigNumber> {
    return this.contract.getNonce(address);
  }

  // Returns the EIP712 type hash for the attest function.
  public getAttestTypeHash(): Promise<string> {
    return this.contract.getAttestTypeHash();
  }

  // Returns the EIP712 type hash for the revoke function.
  public getRevokeTypeHash(): Promise<string> {
    return this.contract.getRevokeTypeHash();
  }
}
