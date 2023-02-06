import { ZERO_ADDRESS } from './utils';
import { BigNumber, utils } from 'ethers';
import { CID } from 'multiformats';
import { MultihashDigest } from 'multiformats/types/src/cid';

const { FunctionFragment, defaultAbiCoder, isBytesLike, formatBytes32String } = utils;

export type SchemaValue =
  | string
  | boolean
  | number
  | BigNumber
  | Record<string, unknown>
  | Record<string, unknown>[]
  | unknown[];
export interface SchemaItem {
  name: string;
  type: string;
  value: SchemaValue;
}

interface SchemaFullItem extends SchemaItem {
  signature: string;
}

const TUPLE_TYPE = 'tuple';
const TUPLE_ARRAY_TYPE = 'tuple[]';

export class SchemaEncoder {
  public schema: SchemaFullItem[];

  constructor(schema: string) {
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
      } else if (type === TUPLE_ARRAY_TYPE) {
        type = `${componentsType}[]`;
        signature = `${componentsFullType}[]${signatureSuffix}`;
      } else if (type.includes('[]')) {
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

  public encodeData(params: ReadonlyArray<SchemaItem>) {
    if (params.length !== this.schema.length) {
      throw new Error('Invalid number or values');
    }

    const data = [];

    for (const [index, schemaItem] of this.schema.entries()) {
      const { type, name, value } = params[index];
      const sanitizedType = type.replace(/\s/g, '');

      if (
        sanitizedType !== schemaItem.type &&
        sanitizedType !== schemaItem.signature &&
        !(sanitizedType === 'ipfsHash' && schemaItem.type === 'bytes32')
      ) {
        throw new Error(`Incompatible param type: ${sanitizedType}`);
      }

      if (name !== schemaItem.name) {
        throw new Error(`Incompatible param name: ${name}`);
      }

      data.push(
        schemaItem.type === 'bytes32' && schemaItem.name === 'ipfsHash'
          ? SchemaEncoder.decodeIpfsValue(value as string)
          : schemaItem.type === 'bytes32' && typeof value === 'string' && !isBytesLike(value)
          ? formatBytes32String(value)
          : value
      );
    }

    return defaultAbiCoder.encode(this.fullTypes(), data);
  }

  public decodeData(data: string) {
    return defaultAbiCoder.decode(this.fullTypes(), data);
  }

  public isEncodedDataValid(data: string) {
    try {
      this.decodeData(data);

      return true;
    } catch (e) {
      return false;
    }
  }

  public static isCID(cid: string) {
    try {
      CID.parse(cid);
      return true;
    } catch {
      return false;
    }
  }

  public static encodeQmHash(hash: string): string {
    const a = CID.parse(hash);
    return defaultAbiCoder.encode(['bytes32'], [a.multihash.digest]);
  }

  public static decodeQmHash(bytes32: string): string {
    const digest = Uint8Array.from(Buffer.from(bytes32.slice(2), 'hex'));
    const dec: MultihashDigest = {
      digest: digest,
      code: 18,
      size: 32,
      bytes: Uint8Array.from([18, 32, ...digest])
    };

    const dCID = CID.createV0(dec);
    return dCID.toString();
  }

  private static getDefaultValueForTypeName(typeName: string) {
    return typeName === 'bool' ? false : typeName.includes('uint') ? '0' : typeName === 'address' ? ZERO_ADDRESS : '';
  }

  private static decodeIpfsValue(val: string) {
    if (isBytesLike(val)) {
      return SchemaEncoder.encodeBytes32Value(val);
    }

    try {
      const decodedHash = CID.parse(val);
      const encoded = defaultAbiCoder.encode(['bytes32'], [decodedHash.multihash.digest]);

      return encoded;
    } catch {
      return SchemaEncoder.encodeBytes32Value(val);
    }
  }

  private static encodeBytes32Value(value: string) {
    try {
      defaultAbiCoder.encode(['bytes32'], [value]);
      return value;
    } catch (e) {
      return formatBytes32String(value);
    }
  }

  private fullTypes() {
    return this.schema.map((i) => i.signature);
  }
}
