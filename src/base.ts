import { Contract, ContractFactory, providers, Signer } from 'ethers';

export declare type SignerOrProvider = Signer | providers.Provider;

export class Base<C extends Contract> {
  public contract: C;

  constructor(factory: ContractFactory, address: string, signerOrProvider?: SignerOrProvider) {
    this.contract = factory.attach(address) as C;
    if (signerOrProvider) {
      this.connect(signerOrProvider);
    }
  }

  // Connects the API to a specific signer
  public connect(signerOrProvider: SignerOrProvider) {
    this.contract = this.contract.connect(signerOrProvider) as C;

    return this;
  }
}
