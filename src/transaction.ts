import { BaseContract, ContractFactory, Provider, Signer, TransactionReceipt, TransactionResponse } from 'ethers';

export declare type SignerOrProvider = Signer | Provider;

export class Transaction<T> {
  public readonly tx: TransactionResponse;
  private readonly waitCallback: (receipt: TransactionReceipt) => Promise<T>;

  constructor(tx: TransactionResponse, waitCallback: (receipt: TransactionReceipt) => Promise<T>) {
    this.tx = tx;
    this.waitCallback = waitCallback;
  }

  public async wait(confirmations?: number): Promise<T> {
    const receipt = await this.tx.wait(confirmations);
    if (!receipt) {
      throw new Error(`Unable to confirm: ${this.tx}`);
    }

    return this.waitCallback(receipt);
  }
}

export class Base<C extends BaseContract> {
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

  // Gets the chain ID
  public async getChainId(): Promise<bigint> {
    const provider = this.contract.runner?.provider;
    if (!provider) {
      throw new Error("Unable to get the chain ID: provider wasn't set");
    }

    return (await provider.getNetwork()).chainId;
  }
}
