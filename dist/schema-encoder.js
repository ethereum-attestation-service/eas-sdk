"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaEncoder = void 0;
const ethers_1 = require("ethers");
const multiformats_1 = require("multiformats");
const utils_1 = require("./utils");
const TUPLE_TYPE = 'tuple';
const TUPLE_ARRAY_TYPE = 'tuple[]';
const BYTES32 = 'bytes32';
const STRING = 'string';
const ADDRESS = 'address';
const BOOL = 'bool';
const UINT = 'uint';
const IPFS_HASH = 'ipfsHash';
class SchemaEncoder {
    schema;
    constructor(schema) {
        this.schema = [];
        const fixedSchema = schema.replace(new RegExp(`${IPFS_HASH} (\\S+)`, 'g'), `${BYTES32} $1`);
        const fragment = ethers_1.FunctionFragment.from(`func(${fixedSchema})`);
        // The following verification will throw in case of an incorrect schema
        ethers_1.AbiCoder.defaultAbiCoder().getDefaultValue(fragment.inputs);
        for (const paramType of fragment.inputs) {
            const { name, arrayChildren } = paramType;
            let { type } = paramType;
            let signature = name ? `${type} ${name}` : type;
            const signatureSuffix = name ? ` ${name}` : '';
            let typeName = type;
            const isArray = arrayChildren;
            const components = paramType.components ?? arrayChildren?.components ?? [];
            const componentsType = `(${components.map((c) => c.type).join(',')})${isArray ? '[]' : ''}`;
            const componentsFullType = `(${components.map((c) => (c.name ? `${c.type} ${c.name}` : c.type)).join(',')})${isArray ? '[]' : ''}`;
            if (type.startsWith(TUPLE_TYPE)) {
                type = componentsType;
                signature = `${componentsFullType}${signatureSuffix}`;
            }
            else if (type === TUPLE_ARRAY_TYPE) {
                type = `${componentsType}[]`;
                signature = `${componentsFullType}[]${signatureSuffix}`;
            }
            else if (type.includes('[]')) {
                typeName = typeName.replace('[]', '');
            }
            const singleValue = SchemaEncoder.getDefaultValueForTypeName(typeName);
            this.schema.push({
                name,
                type,
                signature,
                value: type.includes('[]') ? [] : singleValue
            });
        }
    }
    encodeData(params) {
        if (params.length !== this.schema.length) {
            throw new Error('Invalid number or values');
        }
        const data = [];
        for (const [index, schemaItem] of this.schema.entries()) {
            const { type, name, value } = params[index];
            const sanitizedType = type.replace(/\s/g, '');
            if (sanitizedType !== schemaItem.type &&
                sanitizedType !== schemaItem.signature &&
                !(sanitizedType === IPFS_HASH && schemaItem.type === BYTES32)) {
                throw new Error(`Incompatible param type: ${sanitizedType}`);
            }
            if (name !== schemaItem.name) {
                throw new Error(`Incompatible param name: ${name}`);
            }
            data.push(schemaItem.type === BYTES32 && schemaItem.name === IPFS_HASH
                ? SchemaEncoder.decodeIpfsValue(value)
                : schemaItem.type === BYTES32 && typeof value === 'string' && !(0, ethers_1.isBytesLike)(value)
                    ? (0, ethers_1.encodeBytes32String)(value)
                    : value);
        }
        return ethers_1.AbiCoder.defaultAbiCoder().encode(this.signatures(), data);
    }
    decodeData(data) {
        const values = ethers_1.AbiCoder.defaultAbiCoder().decode(this.signatures(), data).toArray();
        return this.schema.map((s, i) => {
            const fragment = ethers_1.FunctionFragment.from(`func(${s.signature})`);
            if (fragment.inputs.length !== 1) {
                throw new Error(`Unexpected inputs: ${fragment.inputs}`);
            }
            let value = values[i];
            const input = fragment.inputs[0];
            const components = input.components ?? input.arrayChildren?.components ?? [];
            if (value.length > 0 && typeof value !== STRING && components?.length > 0) {
                if (Array.isArray(value[0])) {
                    const namedValues = [];
                    for (const val of value) {
                        const namedValue = [];
                        const rawValues = val.toArray().filter((v) => typeof v !== 'object');
                        for (const [k, v] of rawValues.entries()) {
                            const component = components[k];
                            namedValue.push({ name: component.name, type: component.type, value: v });
                        }
                        namedValues.push(namedValue);
                    }
                    value = {
                        name: s.name,
                        type: s.type,
                        value: namedValues
                    };
                }
                else {
                    const namedValue = [];
                    const rawValues = value.filter((v) => typeof v !== 'object');
                    for (const [k, v] of rawValues.entries()) {
                        const component = components[k];
                        namedValue.push({ name: component.name, type: component.type, value: v });
                    }
                    value = {
                        name: s.name,
                        type: s.type,
                        value: namedValue
                    };
                }
            }
            else {
                value = { name: s.name, type: s.type, value };
            }
            return {
                name: s.name,
                type: s.type,
                signature: s.signature,
                value
            };
        });
    }
    static isSchemaValid(schema) {
        try {
            new SchemaEncoder(schema);
            return true;
        }
        catch (_e) {
            return false;
        }
    }
    isEncodedDataValid(data) {
        try {
            this.decodeData(data);
            return true;
        }
        catch (_e) {
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
        return ethers_1.AbiCoder.defaultAbiCoder().encode([BYTES32], [a.multihash.digest]);
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
        return typeName === BOOL ? false : typeName.includes(UINT) ? '0' : typeName === ADDRESS ? utils_1.ZERO_ADDRESS : '';
    }
    static decodeIpfsValue(val) {
        if ((0, ethers_1.isBytesLike)(val)) {
            return SchemaEncoder.encodeBytes32Value(val);
        }
        try {
            const decodedHash = multiformats_1.CID.parse(val);
            const encoded = ethers_1.AbiCoder.defaultAbiCoder().encode([BYTES32], [decodedHash.multihash.digest]);
            return encoded;
        }
        catch {
            return SchemaEncoder.encodeBytes32Value(val);
        }
    }
    static encodeBytes32Value(value) {
        try {
            ethers_1.AbiCoder.defaultAbiCoder().encode([BYTES32], [value]);
            return value;
        }
        catch (_e) {
            return (0, ethers_1.encodeBytes32String)(value);
        }
    }
    signatures() {
        return this.schema.map((i) => i.signature);
    }
}
exports.SchemaEncoder = SchemaEncoder;
//# sourceMappingURL=schema-encoder.js.map