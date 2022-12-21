import { Contract, ContractFactory, providers, Signer } from 'ethers';
export declare type SignerOrProvider = Signer | providers.Provider;
export declare class Base<C extends Contract> {
    contract: C;
    constructor(factory: ContractFactory, address: string, signerOrProvider?: SignerOrProvider);
    connect(signerOrProvider: SignerOrProvider): this;
}
