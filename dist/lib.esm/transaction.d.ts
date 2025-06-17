import { BaseContract, ContractFactory, ContractTransaction, TransactionReceipt, TransactionRequest } from 'ethers';
export interface TransactionProvider {
    estimateGas: (tx: TransactionRequest) => Promise<bigint>;
    call: (tx: TransactionRequest) => Promise<string>;
    resolveName: (name: string) => Promise<null | string>;
}
export interface TransactionSigner extends TransactionProvider {
    sendTransaction: (tx: TransactionRequest) => Promise<any>;
}
export declare const RequireSigner: (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class Transaction<T> {
    readonly data: ContractTransaction;
    receipt?: TransactionReceipt;
    private readonly signer;
    private readonly waitCallback;
    constructor(data: ContractTransaction, signer: TransactionSigner | TransactionProvider, waitCallback: (receipt: TransactionReceipt) => Promise<T>);
    wait(confirmations?: number): Promise<T>;
}
export declare class Base<C extends BaseContract> {
    contract: C;
    protected signer?: TransactionSigner | TransactionProvider;
    constructor(factory: ContractFactory, address: string, signer?: TransactionSigner | TransactionProvider);
    connect(signer: TransactionSigner | TransactionProvider): this;
    getChainId(): Promise<bigint>;
}
