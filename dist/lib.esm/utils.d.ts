import { TransactionReceipt, TransactionResponse } from 'ethers';
export declare const ZERO_ADDRESS: string;
export declare const ZERO_BYTES = "0x";
export declare const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
export declare const getUIDFromAttestTx: (res: Promise<TransactionResponse> | TransactionResponse) => Promise<string>;
export declare const getUIDsFromMultiAttestTx: (res: Promise<TransactionResponse> | TransactionResponse) => Promise<string[]>;
export declare const getUIDsFromAttestReceipt: (receipt: TransactionReceipt) => string[];
export declare const getTimestampFromTimestampReceipt: (receipt: TransactionReceipt) => bigint[];
export declare const getTimestampFromOffchainRevocationReceipt: (receipt: TransactionReceipt) => bigint[];
