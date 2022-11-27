import { BigNumber, utils } from 'ethers';
export type SchemaValue = string | boolean | BigNumber;
export type SchemaItem = {
    name: string;
    type: string;
    value: SchemaValue | SchemaValue[];
};
export declare class SchemaEncoder {
    schema: SchemaItem[];
    constructor(schema: string);
    encodeData(params: any[]): string;
    decodeData(data: string): utils.Result;
    isEncodedDataValid(data: string): boolean;
    static isCID(cid: string): boolean;
    static encodeQmHash(hash: string): string;
    static decodeQmHash(bytes32: string): string;
    private static getDefaultValueForTypeName;
    private static decodeIpfsValue;
    private static encodeBytes32Value;
    private types;
}
