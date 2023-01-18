import { Contract, ContractFactory, ContractReceipt, ContractTransaction, providers, Signer } from 'ethers';

export declare type SignerOrProvider = Signer | providers.Provider;

export class Transaction<T> {
  private tx: Promise<ContractTransaction>;
  private waitCallback: (receipt: ContractReceipt) => Promise<T>;

  constructor(tx: Promise<ContractTransaction>, waitCallback: (receipt: ContractReceipt) => Promise<T>) {
    this.tx = tx;
    this.waitCallback = waitCallback;
  }

  public async wait(confirmations?: number): Promise<T> {
    const receipt = await (await this.tx).wait(confirmations);

    return this.waitCallback(receipt);
  }
}

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
