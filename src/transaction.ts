import {
  AccessList,
  Addressable,
  BaseContract,
  Block,
  ContractFactory,
  ContractRunner,
  MinedTransactionResponse,
  TransactionLike,
  TransactionReceipt,
  TransactionRequest
} from 'ethers';

export interface EthersSignature {
  r: string;
  s: string;
  v: 27 | 28;
  networkV: null | bigint;

  get legacyChainId(): null | bigint;
  get yParity(): 0 | 1;
  get yParityAndS(): string;
  get compactSerialized(): string;
  get serialized(): string;

  clone(): EthersSignature;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toJSON(): any;
}

export interface TransactionResponse extends TransactionLike<string> {
  readonly blockNumber: null | number;
  readonly blockHash: null | string;
  readonly index: number;
  readonly hash: string;
  readonly type: number;
  readonly to: null | string;
  readonly from: string;
  readonly nonce: number;
  readonly gasLimit: bigint;
  readonly gasPrice: bigint;
  readonly maxPriorityFeePerGas: null | bigint;
  readonly maxFeePerGas: null | bigint;
  readonly maxFeePerBlobGas?: null | bigint;
  readonly data: string;
  readonly value: bigint;
  readonly chainId: bigint;
  readonly signature: EthersSignature;
  readonly accessList: null | AccessList;
  readonly blobVersionedHashes?: null | Array<string>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toJSON(): any;
  getBlock(): Promise<null | Block>;
  getTransaction(): Promise<null | TransactionResponse>;
  confirmations(): Promise<number>;
  wait(confirms?: number, timeout?: number): Promise<null | TransactionReceipt>;
  isMined(): this is MinedTransactionResponse;
  isLegacy(): this is TransactionResponse & { accessList: null; maxFeePerGas: null; maxPriorityFeePerGas: null };
}

export interface Signer extends Addressable {
  estimateGas?: (tx: TransactionRequest) => Promise<bigint>;
  call?: (tx: TransactionRequest) => Promise<string>;
  resolveName?: (name: string) => Promise<null | string>;
  sendTransaction?: (tx: TransactionRequest) => Promise<TransactionResponse>;
}

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

  constructor(factory: ContractFactory, address: string, signer?: Signer) {
    this.contract = factory.attach(address) as C;
    if (signer) {
      this.connect(signer);
    }
  }

  // Connects the API to a specific signer
  public connect(signer: Signer) {
    this.contract = this.contract.connect(signer as unknown as ContractRunner) as C;

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
