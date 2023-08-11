import { BaseContract, ContractFactory, Provider, Signer, TransactionReceipt, TransactionResponse } from 'ethers';
export declare type SignerOrProvider = Signer | Provider;
export declare class Transaction<T> {
    readonly tx: TransactionResponse;
    private readonly waitCallback;
    constructor(tx: TransactionResponse, waitCallback: (receipt: TransactionReceipt) => Promise<T>);
    wait(confirmations?: number): Promise<T>;
}
export declare class Base<C extends BaseContract> {
    contract: C;
    constructor(factory: ContractFactory, address: string, signerOrProvider?: SignerOrProvider);
    connect(signerOrProvider: SignerOrProvider): this;
    getChainId(): Promise<bigint>;
}
