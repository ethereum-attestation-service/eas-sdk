import { Contract, ContractFactory, ContractReceipt, ContractTransaction, providers, Signer } from 'ethers';
export declare type SignerOrProvider = Signer | providers.Provider;
export declare class Transaction<T> {
    private tx;
    private waitCallback;
    constructor(tx: Promise<ContractTransaction>, waitCallback: (receipt: ContractReceipt) => Promise<T>);
    wait(confirmations?: number): Promise<T>;
}
export declare class Base<C extends Contract> {
    contract: C;
    constructor(factory: ContractFactory, address: string, signerOrProvider?: SignerOrProvider);
    connect(signerOrProvider: SignerOrProvider): this;
}
