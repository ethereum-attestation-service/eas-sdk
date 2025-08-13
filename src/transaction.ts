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

// Overloads to support both legacy (experimental) and standard (TC39) decorators
export function RequireSigner(
  _target: unknown,
  _propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RequireSigner<TFn extends (this: unknown, ...args: any[]) => any>(
  value: TFn,
  _context: ClassMethodDecoratorContext
): TFn;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RequireSigner(...args: any[]): any {
  // Standard decorator: (value, context)
  if (args.length === 2) {
    const [value] = args as [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this: unknown, ...fnArgs: any[]) => any,
      ClassMethodDecoratorContext
    ];

    const wrapped = function (
      this: unknown,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...fnArgs: any[]
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signer: TransactionSigner | undefined = (this as any).signer;
      if (!signer || !signer.sendTransaction) {
        throw new Error('Invalid signer');
      }
      return value.apply(this as unknown, fnArgs);
    };

    return wrapped;
  }

  // Legacy decorator: (target, propertyKey, descriptor)
  const [_target, _propertyKey, descriptor] = args as [unknown, string, PropertyDescriptor];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const original = descriptor.value as unknown as (this: unknown, ...fnArgs: any[]) => unknown;

  descriptor.value = function (
    this: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...fnArgs: any[]
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signer: TransactionSigner | undefined = (this as any).signer;
    if (!signer || !signer.sendTransaction) {
      throw new Error('Invalid signer');
    }
    return original.apply(this as unknown, fnArgs);
  };

  return descriptor;
}

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

  // Estimate gas for the transaction
  public estimateGas(): Promise<bigint> {
    return this.signer.estimateGas(this.data);
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
