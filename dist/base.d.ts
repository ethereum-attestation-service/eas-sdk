import { Contract, ContractFactory, Signer } from 'ethers';
export declare class Base<C extends Contract> {
    contract: C;
    constructor(factory: ContractFactory, address: string);
    connect(signer: Signer): this;
}
