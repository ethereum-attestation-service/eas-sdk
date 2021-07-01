import { keccak256 } from "@ethersproject/keccak256";
import { defaultAbiCoder } from "@ethersproject/abi";
import { toUtf8Bytes } from "@ethersproject/strings";
import { pack } from "@ethersproject/solidity";
import { getAddress } from "@ethersproject/address";

export const ATTEST_TYPED_SIGNATURE =
  "Attest(address recipient,uint256 ao,uint256 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)";
export const REVOKE_TYPED_SIGNATURE = "Revoke(bytes32 uuid,uint256 nonce)";
export const EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
export const EIP712_NAME = "EAS";

export interface EIP712Config {
  address: string;
  version: string;
  chainId: number;
}

export type EIP712Params = {
  nonce: number;
};

export type EIP712AttestationParams = EIP712Params & {
  recipient: string;
  ao: number;
  expirationTime: number;
  refUUID: string;
  data: Buffer;
};

export type EIP712RevocationParams = EIP712Params & {
  uuid: string;
};

export interface EIP712Request {
  v: number;
  r: Buffer;
  s: Buffer;
}

export interface EIP712AttestationRequest extends EIP712Request {
  params: EIP712AttestationParams;
}

export interface EIP712RevocationRequest extends EIP712Request {
  params: EIP712RevocationParams;
}

export type Signature = { v: number; r: Buffer; s: Buffer };
export type SignData = (message: Buffer) => Promise<Signature>;
export type VerifyData = (message: Buffer, signature: Signature) => Promise<string>;

export interface TypedData {
  name: string;
  type:
    | "bool"
    | "uint8"
    | "uint16"
    | "uint32"
    | "uint64"
    | "uint128"
    | "uint256"
    | "address"
    | "string"
    | "bytes"
    | "bytes32";
}

export const ATTEST_PRIMARY_TYPE = "Attest";
export const REVOKE_PRIMARY_TYPE = "Revoke";
export const DOMAIN_TYPE: TypedData[] = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" }
];

export const ATTEST_TYPE: TypedData[] = [
  { name: "recipient", type: "address" },
  { name: "ao", type: "uint256" },
  { name: "expirationTime", type: "uint256" },
  { name: "refUUID", type: "bytes32" },
  { name: "data", type: "bytes" },
  { name: "nonce", type: "uint256" }
];

export const REVOKE_TYPE: TypedData[] = [
  { name: "uuid", type: "bytes32" },
  { name: "nonce", type: "uint256" }
];

export interface EIP712DomainTypedData {
  chainId: number;
  name: string;
  verifyingContract: string;
  version: string;
}

export interface EIP712MessageTypes {
  EIP712Domain: TypedData[];
  [additionalProperties: string]: TypedData[];
}

export interface EIP712TypedData<T extends EIP712MessageTypes> {
  domain: EIP712DomainTypedData;
  primaryType: keyof T;
  types: T;
  message: any;
}

export interface EIP712AttestationMessageTypes extends EIP712MessageTypes {
  Attest: typeof ATTEST_TYPE;
}

export interface EIP712AttestationTypedData extends EIP712TypedData<EIP712AttestationMessageTypes> {
  message: EIP712AttestationParams;
}

export interface EIP712RevocationMessageTypes extends EIP712MessageTypes {
  Revoke: typeof REVOKE_TYPE;
}

export interface EIP712RevocationTypedData extends EIP712TypedData<EIP712RevocationMessageTypes> {
  message: EIP712RevocationParams;
}

export interface EIP712AttestationTypedDataRequest extends EIP712Request {
  data: EIP712AttestationTypedData;
}

export interface EIP712RevocationTypedDataRequest extends EIP712Request {
  data: EIP712RevocationTypedData;
}

export type SignTypedData<T extends EIP712MessageTypes> = (data: EIP712TypedData<T>) => Promise<Signature>;
export type VerifyTypedData<T extends EIP712MessageTypes> = (
  data: EIP712TypedData<T>,
  signature: Signature
) => Promise<string>;

export class Proxy {
  private eip712Config: EIP712Config;

  public constructor(eip712Config: EIP712Config) {
    this.eip712Config = eip712Config;
  }

  public getDomainSeparator() {
    return keccak256(
      defaultAbiCoder.encode(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
        [
          keccak256(toUtf8Bytes(EIP712_DOMAIN)),
          keccak256(toUtf8Bytes(EIP712_NAME)),
          keccak256(toUtf8Bytes(this.eip712Config.version)),
          this.eip712Config.chainId,
          this.eip712Config.address
        ]
      )
    );
  }

  public getDomainTypedData(): EIP712DomainTypedData {
    return {
      name: EIP712_NAME,
      version: this.eip712Config.version,
      chainId: this.eip712Config.chainId,
      verifyingContract: this.eip712Config.address
    };
  }

  public async getAttestationRequest(
    params: EIP712AttestationParams,
    signData: SignData
  ): Promise<EIP712AttestationRequest> {
    const digest = this.getAttestationDigest(params);
    const { v, r, s } = await signData(Buffer.from(digest.slice(2), "hex"));

    return { v, r, s, params };
  }

  public async verifyAttestationRequest(
    attester: string,
    request: EIP712AttestationRequest,
    verifyData: VerifyData
  ): Promise<boolean> {
    const digest = this.getAttestationDigest(request.params);
    const recoveredAddress = await verifyData(Buffer.from(digest.slice(2), "hex"), {
      v: request.v,
      s: request.s,
      r: request.r
    });

    return getAddress(attester) === getAddress(recoveredAddress);
  }

  public async getAttestationTypedDataRequest(
    params: EIP712AttestationParams,
    signTypedData: SignTypedData<EIP712AttestationMessageTypes>
  ): Promise<EIP712AttestationTypedDataRequest> {
    const data = this.getAttestationTypedData(params);
    const { v, r, s } = await signTypedData(data);

    return {
      v,
      r,
      s,
      data
    };
  }

  public async verifyAttestationTypedDataRequest(
    attester: string,
    request: EIP712AttestationTypedDataRequest,
    verifyTypedData: VerifyTypedData<EIP712AttestationMessageTypes>
  ): Promise<boolean> {
    const recoveredAddress = await verifyTypedData(request.data, {
      v: request.v,
      s: request.s,
      r: request.r
    });

    return getAddress(attester) === getAddress(recoveredAddress);
  }

  public async getRevocationRequest(
    params: EIP712RevocationParams,
    signData: SignData
  ): Promise<EIP712RevocationRequest> {
    const digest = this.getRevocationDigest(params);
    const { v, r, s } = await signData(Buffer.from(digest.slice(2), "hex"));

    return { v, r, s, params };
  }

  public async verifyRevocationRequest(
    attester: string,
    request: EIP712RevocationRequest,
    verifyData: VerifyData
  ): Promise<boolean> {
    const digest = this.getRevocationDigest(request.params);
    const recoveredAddress = await verifyData(Buffer.from(digest.slice(2), "hex"), {
      v: request.v,
      s: request.s,
      r: request.r
    });

    return getAddress(attester) === getAddress(recoveredAddress);
  }

  public async getRevocationTypedDataRequest(
    params: EIP712RevocationParams,
    signTypedData: SignTypedData<EIP712RevocationMessageTypes>
  ): Promise<EIP712RevocationTypedDataRequest> {
    const data = this.getRevocationTypedData(params);
    const { v, r, s } = await signTypedData(data);

    return {
      v,
      r,
      s,
      data
    };
  }

  public async verifyRevocationTypedDataRequest(
    attester: string,
    request: EIP712RevocationTypedDataRequest,
    verifyTypedData: VerifyTypedData<EIP712RevocationMessageTypes>
  ): Promise<boolean> {
    const recoveredAddress = await verifyTypedData(request.data, {
      v: request.v,
      s: request.s,
      r: request.r
    });

    return getAddress(attester) === getAddress(recoveredAddress);
  }

  private getAttestationDigest(params: EIP712AttestationParams): string {
    return keccak256(
      pack(
        ["bytes1", "bytes1", "bytes32", "bytes32"],
        [
          "0x19",
          "0x01",
          this.getDomainSeparator(),
          keccak256(
            defaultAbiCoder.encode(
              ["bytes32", "address", "uint256", "uint256", "bytes32", "bytes32", "uint256"],
              [
                keccak256(toUtf8Bytes(ATTEST_TYPED_SIGNATURE)),
                params.recipient,
                params.ao,
                params.expirationTime,
                params.refUUID,
                keccak256(params.data),
                params.nonce
              ]
            )
          )
        ]
      )
    );
  }

  private getRevocationDigest(params: EIP712RevocationParams): string {
    return keccak256(
      pack(
        ["bytes1", "bytes1", "bytes32", "bytes32"],
        [
          "0x19",
          "0x01",
          this.getDomainSeparator(),
          keccak256(
            defaultAbiCoder.encode(
              ["bytes32", "bytes32", "uint256"],
              [keccak256(toUtf8Bytes(REVOKE_TYPED_SIGNATURE)), params.uuid, params.nonce]
            )
          )
        ]
      )
    );
  }

  private getAttestationTypedData(params: EIP712AttestationParams): EIP712AttestationTypedData {
    return {
      domain: this.getDomainTypedData(),
      primaryType: ATTEST_PRIMARY_TYPE,
      message: params,
      types: {
        EIP712Domain: DOMAIN_TYPE,
        Attest: ATTEST_TYPE
      }
    };
  }

  private getRevocationTypedData(params: EIP712RevocationParams): EIP712RevocationTypedData {
    return {
      domain: this.getDomainTypedData(),
      primaryType: REVOKE_PRIMARY_TYPE,
      message: params,
      types: {
        EIP712Domain: DOMAIN_TYPE,
        Revoke: REVOKE_TYPE
      }
    };
  }
}
