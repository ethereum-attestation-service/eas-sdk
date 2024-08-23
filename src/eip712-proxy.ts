import { EIP712Proxy__factory, EIP712Proxy as EIP712ProxyContract } from '@ethereum-attestation-service/eas-contracts';
import { Overrides, TransactionReceipt } from 'ethers';
import { legacyVersion } from './legacy/version';
import { DelegatedProxy } from './offchain';
import {
  DelegatedProxyAttestationRequest,
  DelegatedProxyRevocationRequest,
  MultiDelegatedProxyAttestationRequest,
  MultiDelegatedProxyRevocationRequest,
  NO_EXPIRATION
} from './request';
import { Base, RequireSigner, Transaction, TransactionProvider, TransactionSigner } from './transaction';
import { getUIDsFromAttestReceipt, ZERO_BYTES32 } from './utils';

export interface EIP712ProxyOptions {
  signer?: TransactionSigner | TransactionProvider;
}

export class EIP712Proxy extends Base<EIP712ProxyContract> {
  private delegated?: DelegatedProxy;

  constructor(address: string, options?: EIP712ProxyOptions) {
    const { signer } = options || {};

    super(new EIP712Proxy__factory(), address, signer);
  }

  // Connects the API to a specific signer
  public connect(signer: TransactionSigner | TransactionProvider) {
    delete this.delegated;

    super.connect(signer);

    return this;
  }

  // Returns the version of the contract
  public async getVersion(): Promise<string> {
    return (await legacyVersion(this.contract)) ?? this.contract.version();
  }

  // Returns the address of the EAS contract
  public getEAS(): Promise<string> {
    return this.contract.getEAS();
  }

  // Returns the EIP712 name
  public getName(): Promise<string> {
    return this.contract.getName();
  }

  // Returns the domain separator used in the encoding of the signatures for attest, and revoke
  public getDomainSeparator(): Promise<string> {
    return this.contract.getDomainSeparator();
  }
  // Returns the EIP712 type hash for the attest function
  public getAttestTypeHash(): Promise<string> {
    return this.contract.getAttestTypeHash();
  }

  // Returns the EIP712 type hash for the revoke function
  public getRevokeTypeHash(): Promise<string> {
    return this.contract.getRevokeTypeHash();
  }

  // Returns the attester for a given uid
  public getAttester(uid: string): Promise<string> {
    return this.contract.getAttester(uid);
  }

  // Returns the delegated attestations helper
  public getDelegated(): Promise<DelegatedProxy> | DelegatedProxy {
    if (this.delegated) {
      return this.delegated;
    }

    return this.setDelegated();
  }

  // Attests to a specific schema via an EIP712 delegation request using an external EIP712 proxy
  @RequireSigner
  public async attestByDelegationProxy(
    {
      schema,
      data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUID = ZERO_BYTES32, value = 0n },
      attester,
      signature,
      deadline = NO_EXPIRATION
    }: DelegatedProxyAttestationRequest,
    overrides?: Overrides
  ): Promise<Transaction<string>> {
    return new Transaction(
      await this.contract.attestByDelegation.populateTransaction(
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
        { value, ...overrides }
      ),
      this.signer!,
      // eslint-disable-next-line require-await
      async (receipt: TransactionReceipt) => getUIDsFromAttestReceipt(receipt)[0]
    );
  }

  // Multi-attests to multiple schemas via an EIP712 delegation requests using an external EIP712 proxy
  @RequireSigner
  public async multiAttestByDelegationProxy(
    requests: MultiDelegatedProxyAttestationRequest[],
    overrides?: Overrides
  ): Promise<Transaction<string[]>> {
    const multiAttestationRequests = requests.map((r) => ({
      schema: r.schema,
      data: r.data.map((d) => ({
        recipient: d.recipient,
        expirationTime: d.expirationTime ?? NO_EXPIRATION,
        revocable: d.revocable ?? true,
        refUID: d.refUID ?? ZERO_BYTES32,
        data: d.data ?? ZERO_BYTES32,
        value: d.value ?? 0n
      })),
      signatures: r.signatures,
      attester: r.attester,
      deadline: r.deadline ?? NO_EXPIRATION
    }));

    const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
      const total = data.reduce((res, r) => res + r.value, 0n);
      return res + total;
    }, 0n);

    return new Transaction(
      await this.contract.multiAttestByDelegation.populateTransaction(multiAttestationRequests, {
        value: requestedValue,
        ...overrides
      }),
      this.signer!,
      // eslint-disable-next-line require-await
      async (receipt: TransactionReceipt) => getUIDsFromAttestReceipt(receipt)
    );
  }

  // Revokes an existing attestation an EIP712 delegation request using an external EIP712 proxy
  @RequireSigner
  public async revokeByDelegationProxy(
    {
      schema,
      data: { uid, value = 0n },
      signature,
      revoker,
      deadline = NO_EXPIRATION
    }: DelegatedProxyRevocationRequest,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    return new Transaction(
      await this.contract.revokeByDelegation.populateTransaction(
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
        { value, ...overrides }
      ),
      this.signer!,
      async () => {}
    );
  }

  // Multi-revokes multiple attestations via an EIP712 delegation requests using an external EIP712 proxy
  @RequireSigner
  public async multiRevokeByDelegationProxy(
    requests: MultiDelegatedProxyRevocationRequest[],
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const multiRevocationRequests = requests.map((r) => ({
      schema: r.schema,
      data: r.data.map((d) => ({
        uid: d.uid,
        value: d.value ?? 0n
      })),
      signatures: r.signatures,
      revoker: r.revoker,
      deadline: r.deadline ?? NO_EXPIRATION
    }));

    const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
      const total = data.reduce((res, r) => res + r.value, 0n);
      return res + total;
    }, 0n);

    return new Transaction(
      await this.contract.multiRevokeByDelegation.populateTransaction(multiRevocationRequests, {
        value: requestedValue,
        ...overrides
      }),
      this.signer!,
      async () => {}
    );
  }

  // Sets the delegated attestations helper
  private async setDelegated(): Promise<DelegatedProxy> {
    this.delegated = new DelegatedProxy({
      name: await this.getName(),
      address: await this.contract.getAddress(),
      version: await this.getVersion(),
      chainId: await this.getChainId()
    });

    return this.delegated;
  }
}
