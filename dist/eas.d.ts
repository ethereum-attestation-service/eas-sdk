import { EIP712Proxy } from './eip712-proxy';
import { Delegated, Offchain } from './offchain';
import { AttestationRequest, DelegatedAttestationRequest, DelegatedProxyAttestationRequest, DelegatedProxyRevocationRequest, DelegatedRevocationRequest, MultiAttestationRequest, MultiDelegatedAttestationRequest, MultiDelegatedProxyAttestationRequest, MultiDelegatedProxyRevocationRequest, MultiDelegatedRevocationRequest, MultiRevocationRequest, RevocationRequest } from './request';
import { Base, SignerOrProvider, Transaction } from './transaction';
import { EAS as EASContract } from '@ethereum-attestation-service/eas-contracts';
import { BigNumber, BigNumberish, Overrides, PayableOverrides } from 'ethers';
export { PayableOverrides, Overrides } from 'ethers';
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
    private delegated?;
    private offchain?;
    constructor(address: string, options?: EASOptions);
    connect(signerOrProvider: SignerOrProvider): this;
    getVersion(): Promise<string>;
    getAttestation(uid: string): Promise<Attestation>;
    isAttestationValid(uid: string): Promise<boolean>;
    isAttestationRevoked(uid: string): Promise<boolean>;
    getTimestamp(data: string): Promise<BigNumberish>;
    getRevocationOffchain(user: string, uid: string): Promise<BigNumberish>;
    getEIP712Proxy(): EIP712Proxy | undefined;
    getDelegated(): Promise<Delegated> | Delegated;
    getOffchain(): Promise<Offchain> | Offchain;
    attest({ schema, data: { recipient, data, expirationTime, revocable, refUID, value } }: AttestationRequest, overrides?: PayableOverrides): Promise<Transaction<string>>;
    attestByDelegation({ schema, data: { recipient, data, expirationTime, revocable, refUID, value }, attester, signature }: DelegatedAttestationRequest, overrides?: PayableOverrides): Promise<Transaction<string>>;
    multiAttest(requests: MultiAttestationRequest[], overrides?: PayableOverrides): Promise<Transaction<string[]>>;
    multiAttestByDelegation(requests: MultiDelegatedAttestationRequest[], overrides?: PayableOverrides): Promise<Transaction<string[]>>;
    revoke({ schema, data: { uid, value } }: RevocationRequest): Promise<Transaction<void>>;
    revokeByDelegation({ schema, data: { uid, value }, signature, revoker }: DelegatedRevocationRequest, overrides?: PayableOverrides): Promise<Transaction<void>>;
    multiRevoke(requests: MultiRevocationRequest[], overrides?: PayableOverrides): Promise<Transaction<void>>;
    multiRevokeByDelegation(requests: MultiDelegatedRevocationRequest[], overrides?: PayableOverrides): Promise<Transaction<void>>;
    attestByDelegationProxy(request: DelegatedProxyAttestationRequest, overrides?: PayableOverrides): Promise<Transaction<string>>;
    multiAttestByDelegationProxy(requests: MultiDelegatedProxyAttestationRequest[], overrides?: PayableOverrides): Promise<Transaction<string[]>>;
    revokeByDelegationProxy(request: DelegatedProxyRevocationRequest, overrides?: PayableOverrides): Promise<Transaction<void>>;
    multiRevokeByDelegationProxy(requests: MultiDelegatedProxyRevocationRequest[], overrides?: PayableOverrides): Promise<Transaction<void>>;
    timestamp(data: string, overrides?: Overrides): Promise<Transaction<BigNumberish>>;
    multiTimestamp(data: string[], overrides?: Overrides): Promise<Transaction<BigNumberish[]>>;
    revokeOffchain(uid: string, overrides?: Overrides): Promise<Transaction<BigNumberish>>;
    multiRevokeOffchain(uids: string[], overrides?: Overrides): Promise<Transaction<BigNumberish[]>>;
    getDomainSeparator(): Promise<string>;
    getNonce(address: string): Promise<BigNumber>;
    getAttestTypeHash(): Promise<string>;
    getRevokeTypeHash(): Promise<string>;
    private setDelegated;
    private setOffchain;
}
