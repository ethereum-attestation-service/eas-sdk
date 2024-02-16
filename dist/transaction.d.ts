import { BaseContract, ContractFactory, Signer as EthersSigner, TransactionReceipt, TransactionResponse } from 'ethers';
export interface Signer extends Omit<EthersSigner, 'provider'> {
}
export declare class Transaction<T> {
    readonly tx: TransactionResponse;
    private readonly waitCallback;
    constructor(tx: TransactionResponse, waitCallback: (receipt: TransactionReceipt) => Promise<T>);
    wait(confirmations?: number): Promise<T>;
}
export declare class Base<C extends BaseContract> {
    contract: C;
    constructor(factory: ContractFactory, address: string, signer?: Signer);
    connect(signer: Signer): this;
    getChainId(): Promise<bigint>;
}
