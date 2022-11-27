"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaEncoder = void 0;
const utils_1 = require("./utils");
const ethers_1 = require("ethers");
const multiformats_1 = require("multiformats");
const { FunctionFragment, defaultAbiCoder, isBytesLike, formatBytes32String } = ethers_1.utils;
class SchemaEncoder {
    schema;
    constructor(schema) {
        this.schema = [];
        const fixedSchema = schema.replace(/ipfsHash/g, 'bytes32');
        const fragment = FunctionFragment.from(`func(${fixedSchema})`);
        // The following verification will throw in case of an incorrect schema
        defaultAbiCoder.getDefaultValue(fragment.inputs);
        for (const paramType of fragment.inputs) {
            const { name, type } = paramType;
            let typeName = type;
            if (typeName.includes('[]')) {
                typeName = typeName.replace('[]', '');
            }
            const singleValue = SchemaEncoder.getDefaultValueForTypeName(typeName);
            this.schema.push({
                name,
                type,
                value: type.includes('[]') ? [] : singleValue
            });
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    encodeData(params) {
        if (params.length !== this.schema.length) {
            throw new Error('Invalid number or values');
        }
        const data = [];
        for (const [index, schemaItem] of this.schema.entries()) {
            const value = params[index];
            data.push(schemaItem.type === 'bytes32' && schemaItem.name === 'ipfsHash'
                ? SchemaEncoder.decodeIpfsValue(value)
                : schemaItem.type === 'bytes32' && typeof value === 'string' && !isBytesLike(value)
                    ? formatBytes32String(value)
                    : value);
        }
        return defaultAbiCoder.encode(this.types(), data);
    }
    decodeData(data) {
        return defaultAbiCoder.decode(this.types(), data);
    }
    isEncodedDataValid(data) {
        try {
            this.decodeData(data);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    static isCID(cid) {
        try {
            multiformats_1.CID.parse(cid);
            return true;
        }
        catch {
            return false;
        }
    }
    static encodeQmHash(hash) {
        const a = multiformats_1.CID.parse(hash);
        return defaultAbiCoder.encode(['bytes32'], [a.multihash.digest]);
    }
    static decodeQmHash(bytes32) {
        const digest = Uint8Array.from(Buffer.from(bytes32.slice(2), 'hex'));
        const dec = {
            digest: digest,
            code: 18,
            size: 32,
            bytes: Uint8Array.from([18, 32, ...digest])
        };
        const dCID = multiformats_1.CID.createV0(dec);
        return dCID.toString();
    }
    static getDefaultValueForTypeName(typeName) {
        return typeName === 'bool' ? false : typeName.includes('uint') ? '0' : typeName === 'address' ? utils_1.ZERO_ADDRESS : '';
    }
    static decodeIpfsValue(val) {
        if (isBytesLike(val)) {
            return SchemaEncoder.encodeBytes32Value(val);
        }
        try {
            const decodedHash = multiformats_1.CID.parse(val);
            const encoded = defaultAbiCoder.encode(['bytes32'], [decodedHash.multihash.digest]);
            return encoded;
        }
        catch {
            return SchemaEncoder.encodeBytes32Value(val);
        }
    }
    static encodeBytes32Value(value) {
        try {
            defaultAbiCoder.encode(['bytes32'], [value]);
            return value;
        }
        catch (e) {
            return formatBytes32String(value);
        }
    }
    types() {
        return this.schema.map((i) => i.type);
    }
}
exports.SchemaEncoder = SchemaEncoder;
//# sourceMappingURL=schema-encoder.js.map