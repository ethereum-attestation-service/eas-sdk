import { EAS as EASContract } from '@ethereum-attestation-service/eas-contracts';
import { Overrides } from 'ethers';
import { EIP712Proxy } from './eip712-proxy';
import { Delegated, Offchain } from './offchain';
import { AttestationRequest, DelegatedAttestationRequest, DelegatedProxyAttestationRequest, DelegatedProxyRevocationRequest, DelegatedRevocationRequest, MultiAttestationRequest, MultiDelegatedAttestationRequest, MultiDelegatedProxyAttestationRequest, MultiDelegatedProxyRevocationRequest, MultiDelegatedRevocationRequest, MultiRevocationRequest, RevocationRequest } from './request';
import { Base, Transaction, TransactionProvider, TransactionSigner } from './transaction';
export { Overrides } from 'ethers';
export * from './request';
export interface Attestation {
    uid: string;
    schema: string;
    refUID: string;
    time: bigint;
    expirationTime: bigint;
    revocationTime: bigint;
    recipient: string;
    revocable: boolean;
    attester: string;
    data: string;
}
export interface EASOptions {
    signer?: TransactionSigner | TransactionProvider;
    proxy?: EIP712Proxy;
}
export declare const RequireProxy: (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class EAS extends Base<EASContract> {
    private proxy?;
    private delegated?;
    private offchain?;
    private version?;
    private legacyEAS;
    constructor(address: string, options?: EASOptions);
    connect(signer: TransactionSigner | TransactionProvider): this;
    getVersion(): Promise<string>;
    getAttestation(uid: string): Promise<Attestation>;
    isAttestationValid(uid: string): Promise<boolean>;
    isAttestationRevoked(uid: string): Promise<boolean>;
    getTimestamp(data: string): Promise<bigint>;
    getRevocationOffchain(user: string, uid: string): Promise<bigint>;
    getEIP712Proxy(): EIP712Proxy | undefined;
    getDelegated(): Promise<Delegated> | Delegated;
    getOffchain(): Promise<Offchain> | Offchain;
    attest({ schema, data: { recipient, data, expirationTime, revocable, refUID, value } }: AttestationRequest, overrides?: Overrides): Promise<Transaction<string>>;
    attestByDelegation({ schema, data: { recipient, data, expirationTime, revocable, refUID, value }, signature, attester, deadline }: DelegatedAttestationRequest, overrides?: Overrides): Promise<Transaction<string>>;
    multiAttest(requests: MultiAttestationRequest[], overrides?: Overrides): Promise<Transaction<string[]>>;
    multiAttestByDelegation(requests: MultiDelegatedAttestationRequest[], overrides?: Overrides): Promise<Transaction<string[]>>;
    revoke({ schema, data: { uid, value } }: RevocationRequest, overrides?: Overrides): Promise<Transaction<void>>;
    revokeByDelegation({ schema, data: { uid, value }, signature, revoker, deadline }: DelegatedRevocationRequest, overrides?: Overrides): Promise<Transaction<void>>;
    multiRevoke(requests: MultiRevocationRequest[], overrides?: Overrides): Promise<Transaction<void>>;
    multiRevokeByDelegation(requests: MultiDelegatedRevocationRequest[], overrides?: Overrides): Promise<Transaction<void>>;
    attestByDelegationProxy(request: DelegatedProxyAttestationRequest, overrides?: Overrides): Promise<Transaction<string>>;
    multiAttestByDelegationProxy(requests: MultiDelegatedProxyAttestationRequest[], overrides?: Overrides): Promise<Transaction<string[]>>;
    revokeByDelegationProxy(request: DelegatedProxyRevocationRequest, overrides?: Overrides): Promise<Transaction<void>>;
    multiRevokeByDelegationProxy(requests: MultiDelegatedProxyRevocationRequest[], overrides?: Overrides): Promise<Transaction<void>>;
    timestamp(data: string, overrides?: Overrides): Promise<Transaction<bigint>>;
    multiTimestamp(data: string[], overrides?: Overrides): Promise<Transaction<bigint[]>>;
    revokeOffchain(uid: string, overrides?: Overrides): Promise<Transaction<bigint>>;
    multiRevokeOffchain(uids: string[], overrides?: Overrides): Promise<Transaction<bigint[]>>;
    getDomainSeparator(): Promise<string>;
    getNonce(address: string): Promise<bigint>;
    getAttestTypeHash(): Promise<string>;
    getRevokeTypeHash(): Promise<string>;
    static getAttestationUID: (schema: string, recipient: string, attester: string, time: bigint, expirationTime: bigint, revocable: boolean, refUID: string, data: string, bump: number) => string;
    private setDelegated;
    private setOffchain;
    private isLegacyContract;
}
