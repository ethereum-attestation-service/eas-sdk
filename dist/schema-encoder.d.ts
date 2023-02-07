import { BigNumber } from 'ethers';
export type SchemaValue = string | boolean | number | BigNumber | Record<string, unknown> | Record<string, unknown>[] | unknown[];
export interface SchemaItem {
    name: string;
    type: string;
    value: SchemaValue;
}
export interface SchemaItemWithSignature extends SchemaItem {
    signature: string;
}
export declare class SchemaEncoder {
    schema: SchemaItemWithSignature[];
    constructor(schema: string);
    encodeData(params: ReadonlyArray<SchemaItem>): string;
    decodeData(data: string): ReadonlyArray<SchemaItemWithSignature>;
    isEncodedDataValid(data: string): boolean;
    static isCID(cid: string): boolean;
    static encodeQmHash(hash: string): string;
    static decodeQmHash(bytes32: string): string;
    private static getDefaultValueForTypeName;
    private static decodeIpfsValue;
    private static encodeBytes32Value;
    private fullTypes;
}
