import { Signature } from './offchain/typed-data-handler';
import { Base, SignerOrProvider, Transaction } from './transaction';
import {
  getTimestampFromOffchainRevocationEvents,
  getTimestampFromTimestampEvents,
  getUIDsFromAttestEvents,
  ZERO_BYTES32
} from './utils';
import {
  EAS__factory,
  EAS as EASContract,
  EIP712Proxy,
  EIP712Proxy__factory
} from '@ethereum-attestation-service/eas-contracts';
import { BigNumber, BigNumberish, ContractReceipt } from 'ethers';

export interface Attestation {
  uid: string;
  schema: string;
  refUID: string;
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

export interface EASOptions {
  signerOrProvider?: SignerOrProvider;
  proxy?: string;
}

export class EAS extends Base<EASContract> {
  private proxy?: Base<EIP712Proxy>;

  constructor(address: string, { signerOrProvider, proxy }: EASOptions) {
    super(new EAS__factory(), address, signerOrProvider);

    if (proxy) {
      this.proxy = new Base<EIP712Proxy>(new EIP712Proxy__factory(), proxy, signerOrProvider);
    }
  }

  // Returns the version of the contract
  public getVersion(): Promise<string> {
    return this.contract.VERSION();
  }

  // Returns an existing schema by attestation UID
  public getAttestation(uid: string): Promise<Attestation> {
    return this.contract.getAttestation(uid);
  }

  // Returns whether an attestation is valid
  public isAttestationValid(uid: string): Promise<boolean> {
    return this.contract.isAttestationValid(uid);
  }

  // Returns whether an attestation has been revoked
  public async isAttestationRevoked(uid: string): Promise<boolean> {
    const attestation = await this.contract.getAttestation(uid);
    if (attestation.uid === ZERO_BYTES32) {
      throw new Error('Invalid attestation');
    }

    return !attestation.revocationTime.isZero();
  }

  // Returns the timestamp that the specified data was timestamped with.
  public getTimestamp(data: string): Promise<BigNumberish> {
    return this.contract.getTimestamp(data);
  }

  // Returns the timestamp that the specified data was timestamped with.
  public getRevocationOffchain(user: string, uid: string): Promise<BigNumberish> {
    return this.contract.getRevokeOffchain(user, uid);
  }

  // Attests to a specific schema
  public async attest({
    schema,
    data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUID = ZERO_BYTES32, value = 0 }
  }: AttestationRequest): Promise<Transaction<string>> {
    const tx = await this.contract.attest(
      { schema, data: { recipient, expirationTime, revocable, refUID, data, value } },
      {
        value
      }
    );

    return new Transaction(tx, async (receipt: ContractReceipt) => (await getUIDsFromAttestEvents(receipt.events))[0]);
  }

  // Attests to a specific schema via an EIP712 delegation request
  public async attestByDelegation({
    schema,
    data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUID = ZERO_BYTES32, value = 0 },
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
          refUID,
          data,
          value
        },
        signature,
        attester
      },
      { value }
    );

    return new Transaction(tx, async (receipt: ContractReceipt) => (await getUIDsFromAttestEvents(receipt.events))[0]);
  }

  // Multi-attests to multiple schemas
  public async multiAttest(requests: MultiAttestationRequest[]): Promise<Transaction<string[]>> {
    const multiAttestationRequests = requests.map((r) => ({
      schema: r.schema,
      data: r.data.map((d) => ({
        recipient: d.recipient,
        expirationTime: d.expirationTime ?? NO_EXPIRATION,
        revocable: d.revocable ?? true,
        refUID: d.refUID ?? ZERO_BYTES32,
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
    return new Transaction(tx, async (receipt: ContractReceipt) => getUIDsFromAttestEvents(receipt.events));
  }

  // Multi-attests to multiple schemas via an EIP712 delegation requests
  public async multiAttestByDelegation(requests: MultiDelegatedAttestationRequest[]): Promise<Transaction<string[]>> {
    const multiAttestationRequests = requests.map((r) => ({
      schema: r.schema,
      data: r.data.map((d) => ({
        recipient: d.recipient,
        expirationTime: d.expirationTime ?? NO_EXPIRATION,
        revocable: d.revocable ?? true,
        refUID: d.refUID ?? ZERO_BYTES32,
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
    return new Transaction(tx, async (receipt: ContractReceipt) => getUIDsFromAttestEvents(receipt.events));
  }

  // Revokes an existing attestation
  public async revoke({ schema, data: { uid, value = 0 } }: RevocationRequest): Promise<Transaction<void>> {
    const tx = await this.contract.revoke({ schema, data: { uid, value } }, { value });

    return new Transaction(tx, async () => {});
  }

  // Revokes an existing attestation an EIP712 delegation request
  public async revokeByDelegation({
    schema,
    data: { uid, value = 0 },
    signature,
    revoker
  }: DelegatedRevocationRequest): Promise<Transaction<void>> {
    const tx = await this.contract.revokeByDelegation(
      {
        schema,
        data: {
          uid,
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
        uid: d.uid,
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
        uid: d.uid,
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

  // Attests to a specific schema via an EIP712 delegation request using an external EIP712 proxy
  public async attestByDelegationProxy({
    schema,
    data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUID = ZERO_BYTES32, value = 0 },
    attester,
    signature,
    deadline
  }: DelegatedProxyAttestationRequest): Promise<Transaction<string>> {
    if (!this.proxy) {
      throw new Error("Proxy wasn't set");
    }

    const tx = await this.proxy.contract.attestByDelegation(
      {
        schema,
        data: {
          recipient,
          expirationTime,
          revocable,
          refUID,
          data,
          value
        },
        signature,
        attester,
        deadline
      },
      { value }
    );

    return new Transaction(tx, async (receipt: ContractReceipt) => (await getUIDsFromAttestEvents(receipt.events))[0]);
  }

  // Multi-attests to multiple schemas via an EIP712 delegation requests using an external EIP712 proxy
  public async multiAttestByDelegationProxy(
    requests: MultiDelegatedProxyAttestationRequest[]
  ): Promise<Transaction<string[]>> {
    if (!this.proxy) {
      throw new Error("Proxy wasn't set");
    }

    const multiAttestationRequests = requests.map((r) => ({
      schema: r.schema,
      data: r.data.map((d) => ({
        recipient: d.recipient,
        expirationTime: d.expirationTime ?? NO_EXPIRATION,
        revocable: d.revocable ?? true,
        refUID: d.refUID ?? ZERO_BYTES32,
        data: d.data ?? ZERO_BYTES32,
        value: d.value ?? 0
      })),
      signatures: r.signatures,
      attester: r.attester,
      deadline: r.deadline
    }));

    const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
      const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
      return res.add(total);
    }, BigNumber.from(0));

    const tx = await this.proxy.contract.multiAttestByDelegation(multiAttestationRequests, {
      value: requestedValue
    });

    // eslint-disable-next-line require-await
    return new Transaction(tx, async (receipt: ContractReceipt) => getUIDsFromAttestEvents(receipt.events));
  }

  // Revokes an existing attestation an EIP712 delegation request using an external EIP712 proxy
  public async revokeByDelegationProxy({
    schema,
    data: { uid, value = 0 },
    signature,
    revoker,
    deadline
  }: DelegatedProxyRevocationRequest): Promise<Transaction<void>> {
    if (!this.proxy) {
      throw new Error("Proxy wasn't set");
    }

    const tx = await this.proxy.contract.revokeByDelegation(
      {
        schema,
        data: {
          uid,
          value
        },
        signature,
        revoker,
        deadline
      },
      { value }
    );

    return new Transaction(tx, async () => {});
  }

  // Multi-revokes multiple attestations via an EIP712 delegation requests using an external EIP712 proxy
  public async multiRevokeByDelegationProxy(
    requests: MultiDelegatedProxyRevocationRequest[]
  ): Promise<Transaction<void>> {
    if (!this.proxy) {
      throw new Error("Proxy wasn't set");
    }

    const multiRevocationRequests = requests.map((r) => ({
      schema: r.schema,
      data: r.data.map((d) => ({
        uid: d.uid,
        value: d.value ?? 0
      })),
      signatures: r.signatures,
      revoker: r.revoker,
      deadline: r.deadline
    }));

    const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
      const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
      return res.add(total);
    }, BigNumber.from(0));

    const tx = await this.proxy.contract.multiRevokeByDelegation(multiRevocationRequests, {
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

  // Revokes the specified offchain attestation UID.
  public async revokeOffchain(uid: string): Promise<Transaction<BigNumberish>> {
    const tx = await this.contract.revokeOffchain(uid);

    return new Transaction(
      tx,
      async (receipt: ContractReceipt) => (await getTimestampFromOffchainRevocationEvents(receipt.events))[0]
    );
  }

  // Revokes the specified multiple offchain attestation UIDs.
  public async multiRevokeOffchain(uids: string[]): Promise<Transaction<BigNumberish[]>> {
    const tx = await this.contract.multiRevokeOffchain(uids);

    // eslint-disable-next-line require-await
    return new Transaction(tx, async (receipt: ContractReceipt) =>
      getTimestampFromOffchainRevocationEvents(receipt.events)
    );
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
