import { EIP712Proxy as EIP712ProxyContract } from '@ethereum-attestation-service/eas-contracts';
import { Overrides } from 'ethers';
import { DelegatedProxy } from './offchain';
import { DelegatedProxyAttestationRequest, DelegatedProxyRevocationRequest, MultiDelegatedProxyAttestationRequest, MultiDelegatedProxyRevocationRequest } from './request';
import { Base, Transaction, TransactionProvider, TransactionSigner } from './transaction';
export interface EIP712ProxyOptions {
    signer?: TransactionSigner | TransactionProvider;
}
export declare class EIP712Proxy extends Base<EIP712ProxyContract> {
    private delegated?;
    constructor(address: string, options?: EIP712ProxyOptions);
    connect(signer: TransactionSigner | TransactionProvider): this;
    getVersion(): Promise<string>;
    getEAS(): Promise<string>;
    getName(): Promise<string>;
    getDomainSeparator(): Promise<string>;
    getAttestTypeHash(): Promise<string>;
    getRevokeTypeHash(): Promise<string>;
    getAttester(uid: string): Promise<string>;
    getDelegated(): Promise<DelegatedProxy> | DelegatedProxy;
    attestByDelegationProxy({ schema, data: { recipient, data, expirationTime, revocable, refUID, value }, attester, signature, deadline }: DelegatedProxyAttestationRequest, overrides?: Overrides): Promise<Transaction<string>>;
    multiAttestByDelegationProxy(requests: MultiDelegatedProxyAttestationRequest[], overrides?: Overrides): Promise<Transaction<string[]>>;
    revokeByDelegationProxy({ schema, data: { uid, value }, signature, revoker, deadline }: DelegatedProxyRevocationRequest, overrides?: Overrides): Promise<Transaction<void>>;
    multiRevokeByDelegationProxy(requests: MultiDelegatedProxyRevocationRequest[], overrides?: Overrides): Promise<Transaction<void>>;
    private setDelegated;
}
