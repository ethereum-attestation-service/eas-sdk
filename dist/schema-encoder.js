"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaEncoder = void 0;
const utils_1 = require("./utils");
const ethers_1 = require("ethers");
const multiformats_1 = require("multiformats");
const { FunctionFragment, defaultAbiCoder, isBytesLike, formatBytes32String } = ethers_1.utils;
const TUPLE_TYPE = 'tuple';
const TUPLE_ARRAY_TYPE = 'tuple[]';
class SchemaEncoder {
    schema;
    constructor(schema) {
        this.schema = [];
        const fixedSchema = schema.replace(/ipfsHash/g, 'bytes32');
        const fragment = FunctionFragment.from(`func(${fixedSchema})`);
        // The following verification will throw in case of an incorrect schema
        defaultAbiCoder.getDefaultValue(fragment.inputs);
        for (const paramType of fragment.inputs) {
            const { name, components } = paramType;
            let { type } = paramType;
            let signature = name ? `${type} ${name}` : type;
            const signatureSuffix = name ? ` ${name}` : '';
            let typeName = type;
            const componentsType = `(${(components || []).map((c) => c.type).join(',')})`;
            const componentsFullType = `(${(components || [])
                .map((c) => (c.name ? `${c.type} ${c.name}` : c.type))
                .join(',')})`;
            if (type === TUPLE_TYPE) {
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
                !(sanitizedType === 'ipfsHash' && schemaItem.type === 'bytes32')) {
                throw new Error(`Incompatible param type: ${sanitizedType}`);
            }
            if (name !== schemaItem.name) {
                throw new Error(`Incompatible param name: ${name}`);
            }
            data.push(schemaItem.type === 'bytes32' && schemaItem.name === 'ipfsHash'
                ? SchemaEncoder.decodeIpfsValue(value)
                : schemaItem.type === 'bytes32' && typeof value === 'string' && !isBytesLike(value)
                    ? formatBytes32String(value)
                    : value);
        }
        return defaultAbiCoder.encode(this.fullTypes(), data);
    }
    decodeData(data) {
        const values = defaultAbiCoder.decode(this.fullTypes(), data);
        return this.schema.map((s, i) => {
            const fragment = FunctionFragment.from(`func(${s.signature})`);
            if (fragment.inputs.length !== 1) {
                throw new Error(`Unexpected inputs: ${fragment.inputs}`);
            }
            let value = values[i];
            const input = fragment.inputs[0];
            if (value.length > 0 && input.components) {
                if (Array.isArray(value[0])) {
                    const namedValues = [];
                    for (const v of value) {
                        namedValues.push(SchemaEncoder.toNamedValue(input.components, v));
                    }
                    value = namedValues;
                }
                else {
                    value = SchemaEncoder.toNamedValue(input.components, value);
                }
            }
            return {
                name: s.name,
                type: s.type,
                signature: s.signature,
                value
            };
        });
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
    fullTypes() {
        return this.schema.map((i) => i.signature);
    }
    static toNamedValue(components, value) {
        const namedValue = {};
        components.forEach((c) => {
            namedValue.type = c.type;
            namedValue[c.name] = value[c.name];
        });
        return namedValue;
    }
}
exports.SchemaEncoder = SchemaEncoder;
//# sourceMappingURL=schema-encoder.js.map