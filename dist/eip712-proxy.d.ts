import { DelegatedProxyAttestationRequest, DelegatedProxyRevocationRequest, MultiDelegatedProxyAttestationRequest, MultiDelegatedProxyRevocationRequest } from './request';
import { Base, SignerOrProvider, Transaction } from './transaction';
import { EIP712Proxy as EIP712ProxyContract } from '@ethereum-attestation-service/eas-contracts';
export interface EIP712ProxyOptions {
    signerOrProvider?: SignerOrProvider;
}
export declare class EIP712Proxy extends Base<EIP712ProxyContract> {
    constructor(address: string, options?: EIP712ProxyOptions);
    getVersion(): Promise<string>;
    getEAS(): Promise<string>;
    getName(): Promise<string>;
    getDomainSeparator(): Promise<string>;
    getAttestTypeHash(): Promise<string>;
    getRevokeTypeHash(): Promise<string>;
    getAttester(uid: string): Promise<string>;
    attestByDelegationProxy({ schema, data: { recipient, data, expirationTime, revocable, refUID, value }, attester, signature, deadline }: DelegatedProxyAttestationRequest): Promise<Transaction<string>>;
    multiAttestByDelegationProxy(requests: MultiDelegatedProxyAttestationRequest[]): Promise<Transaction<string[]>>;
    revokeByDelegationProxy({ schema, data: { uid, value }, signature, revoker, deadline }: DelegatedProxyRevocationRequest): Promise<Transaction<void>>;
    multiRevokeByDelegationProxy(requests: MultiDelegatedProxyRevocationRequest[]): Promise<Transaction<void>>;
}
