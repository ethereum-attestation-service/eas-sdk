import { EIP712Proxy } from './eip712-proxy';
import { AttestationRequest, DelegatedAttestationRequest, DelegatedProxyAttestationRequest, DelegatedProxyRevocationRequest, DelegatedRevocationRequest, MultiAttestationRequest, MultiDelegatedAttestationRequest, MultiDelegatedProxyAttestationRequest, MultiDelegatedProxyRevocationRequest, MultiDelegatedRevocationRequest, MultiRevocationRequest, RevocationRequest } from './request';
import { Base, SignerOrProvider, Transaction } from './transaction';
import { EAS as EASContract } from '@ethereum-attestation-service/eas-contracts';
import { BigNumber, BigNumberish } from 'ethers';
export * from './request';
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
export interface EASOptions {
    signerOrProvider?: SignerOrProvider;
    proxy?: EIP712Proxy;
}
export declare class EAS extends Base<EASContract> {
    private proxy?;
    constructor(address: string, options?: EASOptions);
    getVersion(): Promise<string>;
    getAttestation(uid: string): Promise<Attestation>;
    isAttestationValid(uid: string): Promise<boolean>;
    isAttestationRevoked(uid: string): Promise<boolean>;
    getTimestamp(data: string): Promise<BigNumberish>;
    getRevocationOffchain(user: string, uid: string): Promise<BigNumberish>;
    getEIP712Proxy(): EIP712Proxy | undefined;
    attest({ schema, data: { recipient, data, expirationTime, revocable, refUID, value } }: AttestationRequest): Promise<Transaction<string>>;
    attestByDelegation({ schema, data: { recipient, data, expirationTime, revocable, refUID, value }, attester, signature }: DelegatedAttestationRequest): Promise<Transaction<string>>;
    multiAttest(requests: MultiAttestationRequest[]): Promise<Transaction<string[]>>;
    multiAttestByDelegation(requests: MultiDelegatedAttestationRequest[]): Promise<Transaction<string[]>>;
    revoke({ schema, data: { uid, value } }: RevocationRequest): Promise<Transaction<void>>;
    revokeByDelegation({ schema, data: { uid, value }, signature, revoker }: DelegatedRevocationRequest): Promise<Transaction<void>>;
    multiRevoke(requests: MultiRevocationRequest[]): Promise<Transaction<void>>;
    multiRevokeByDelegation(requests: MultiDelegatedRevocationRequest[]): Promise<Transaction<void>>;
    attestByDelegationProxy(request: DelegatedProxyAttestationRequest): Promise<Transaction<string>>;
    multiAttestByDelegationProxy(requests: MultiDelegatedProxyAttestationRequest[]): Promise<Transaction<string[]>>;
    revokeByDelegationProxy(request: DelegatedProxyRevocationRequest): Promise<Transaction<void>>;
    multiRevokeByDelegationProxy(requests: MultiDelegatedProxyRevocationRequest[]): Promise<Transaction<void>>;
    timestamp(data: string): Promise<Transaction<BigNumberish>>;
    multiTimestamp(data: string[]): Promise<Transaction<BigNumberish[]>>;
    revokeOffchain(uid: string): Promise<Transaction<BigNumberish>>;
    multiRevokeOffchain(uids: string[]): Promise<Transaction<BigNumberish[]>>;
    getDomainSeparator(): Promise<string>;
    getNonce(address: string): Promise<BigNumber>;
    getAttestTypeHash(): Promise<string>;
    getRevokeTypeHash(): Promise<string>;
}
