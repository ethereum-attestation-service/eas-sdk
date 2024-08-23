import {
  BaseContract,
  ContractFactory,
  ContractRunner,
  ContractTransaction,
  TransactionReceipt,
  TransactionRequest
} from 'ethers';

export interface TransactionProvider {
  estimateGas: (tx: TransactionRequest) => Promise<bigint>;

  call: (tx: TransactionRequest) => Promise<string>;
  resolveName: (name: string) => Promise<null | string>;
}

export interface TransactionSigner extends TransactionProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendTransaction: (tx: TransactionRequest) => Promise<any>;
}

export const RequireSigner = (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => {
  const originalMethod = descriptor.value;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptor.value = function (...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signer: TransactionSigner | undefined = (this as any).signer;
    if (!signer || !signer.sendTransaction) {
      throw new Error('Invalid signer');
    }
    return originalMethod.apply(this, args);
  };

  return descriptor;
};

export class Transaction<T> {
  public readonly data: ContractTransaction;
  public receipt?: TransactionReceipt;
  private readonly signer: TransactionSigner | TransactionProvider;
  private readonly waitCallback: (receipt: TransactionReceipt) => Promise<T>;

  constructor(
    data: ContractTransaction,
    signer: TransactionSigner | TransactionProvider,
    waitCallback: (receipt: TransactionReceipt) => Promise<T>
  ) {
    this.data = data;
    this.signer = signer;
    this.waitCallback = waitCallback;
  }

  @RequireSigner
  public async wait(confirmations?: number): Promise<T> {
    if (this.receipt) {
      throw new Error(`Transaction already broadcast: ${this.receipt}`);
    }

    const tx = await (this.signer as TransactionSigner).sendTransaction(this.data);
    this.receipt = await tx.wait(confirmations);
    if (!this.receipt) {
      throw new Error(`Unable to confirm: ${tx}`);
    }

    return this.waitCallback(this.receipt);
  }
}

export class Base<C extends BaseContract> {
  public contract: C;
  protected signer?: TransactionSigner | TransactionProvider;

  constructor(factory: ContractFactory, address: string, signer?: TransactionSigner | TransactionProvider) {
    this.contract = factory.attach(address) as C;
    if (signer) {
      this.connect(signer);

      this.signer = signer;
    }
  }

  // Connects the API to a specific signer
  public connect(signer: TransactionSigner | TransactionProvider) {
    this.contract = this.contract.connect(signer as unknown as ContractRunner) as C;

    this.signer = signer;

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
