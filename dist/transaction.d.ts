import { BaseContract, ContractFactory, ContractTransaction, TransactionReceipt, TransactionRequest } from 'ethers';
export interface TransactionSigner {
    estimateGas: (tx: TransactionRequest) => Promise<bigint>;
    sendTransaction: (tx: TransactionRequest) => Promise<any>;
    call: (tx: TransactionRequest) => Promise<string>;
    resolveName: (name: string) => Promise<null | string>;
}
export declare class Transaction<T> {
    readonly data: ContractTransaction;
    receipt?: TransactionReceipt;
    private readonly signer;
    private readonly waitCallback;
    constructor(data: ContractTransaction, signer: TransactionSigner, waitCallback: (receipt: TransactionReceipt) => Promise<T>);
    wait(confirmations?: number): Promise<T>;
}
export declare class Base<C extends BaseContract> {
    contract: C;
    protected signer?: TransactionSigner;
    constructor(factory: ContractFactory, address: string, signer?: TransactionSigner);
    connect(signer: TransactionSigner): this;
    getChainId(): Promise<bigint>;
}
