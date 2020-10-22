import { keccak256 } from "@ethersproject/keccak256";
import { defaultAbiCoder } from "@ethersproject/abi";
import { toUtf8Bytes } from "@ethersproject/strings";
import { pack } from "@ethersproject/solidity";

export const ATTEST_TYPED_SIGNATURE =
  "Attest(address recipient,uint256 ao,uint256 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)";
export const REVOKE_TYPED_SIGNATURE = "Revoke(byte32 uuid,uint256 nonce)";
export const EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
export const EIP712_NAME = "EAS";

export interface EIP712Config {
  address: string;
  version: string;
  chainId: number;
}

export interface EIP712Params {
  nonce: number;
}

export interface EIP712AttestationParams extends EIP712Params {
  recipient: string;
  ao: number;
  expirationTime: number;
  refUUID: string;
  data: Buffer;
}

export interface EIP712RevocationParams extends EIP712Params {
  uuid: string;
}

export interface EIP712Request {
  v: number;
  r: string;
  s: string;
}

export interface EIP712AttestationRequest extends EIP712Request {
  params: EIP712AttestationParams;
}

export interface EIP712RevocationRequest extends EIP712Request {
  params: EIP712RevocationParams;
}

export type Signature = { v: number; r: string; s: string };
export type SignMessage = (message: Buffer) => Promise<Signature>;
export type VerifyMessage = (message: Buffer, signature: Signature) => Promise<string>;

export interface Attribute {
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
export const DOMAIN_TYPE: Attribute[] = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" }
];
export const ATTEST_TYPE: Attribute[] = [
  { name: "recipient", type: "address" },
  { name: "ao", type: "uint256" },
  { name: "expirationTime", type: "uint256" },
  { name: "refUUID", type: "bytes32" },
  { name: "data", type: "bytes" },
  { name: "nonce", type: "uint256" }
];
export const REVOKE_TYPE: Attribute[] = [
  { name: "uuid", type: "bytes32" },
  { name: "nonce", type: "uint256" }
];

export interface EIP712DomainTypedData {
  chainId: number;
  name: string;
  verifyingContract: string;
  version: string;
}

export interface EIP712AttestationTypedData {
  domain: EIP712DomainTypedData;
  primaryType: typeof ATTEST_PRIMARY_TYPE;
  types: {
    EIP712Domain: typeof DOMAIN_TYPE;
    Attest: typeof ATTEST_TYPE;
  };
  message: EIP712AttestationParams;
}

export interface EIP712RevocationTypedData {
  domain: EIP712DomainTypedData;
  primaryType: typeof REVOKE_PRIMARY_TYPE;
  types: {
    EIP712Domain: typeof DOMAIN_TYPE;
    Revoke: typeof REVOKE_TYPE;
  };
  message: EIP712RevocationParams;
}

export interface EIP712AttestationTypedDataRequest extends EIP712Request {
  data: EIP712AttestationTypedData;
}

export interface EIP712RevocationTypedDataRequest extends EIP712Request {
  data: EIP712RevocationTypedData;
}

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
      chainId: this.eip712Config.chainId,
      name: EIP712_NAME,
      verifyingContract: this.eip712Config.address,
      version: this.eip712Config.version
    };
  }

  public async getAttestationRequest(
    params: EIP712AttestationParams,
    signMessage: SignMessage
  ): Promise<EIP712AttestationRequest> {
    const digest = this.getAttestationDigest(params);
    const { v, r, s } = await signMessage(Buffer.from(digest.slice(2), "hex"));

    return { v, r, s, params };
  }

  public async verifyAttestationRequest(
    attester: string,
    request: EIP712AttestationRequest,
    verifyMessage: VerifyMessage
  ): Promise<boolean> {
    const digest = this.getAttestationDigest(request.params);
    const recoveredAddress = await verifyMessage(Buffer.from(digest.slice(2), "hex"), {
      v: request.v,
      s: request.s,
      r: request.r
    });

    return attester === recoveredAddress;
  }

  public getAttestationTypedData(params: EIP712AttestationParams): EIP712AttestationTypedData {
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

  public async getAttestationTypedDataRequest(
    params: EIP712AttestationParams,
    signMessage: SignMessage
  ): Promise<EIP712AttestationTypedDataRequest> {
    const digest = this.getAttestationDigest(params);
    const { v, r, s } = await signMessage(Buffer.from(digest.slice(2), "hex"));

    return {
      v,
      r,
      s,
      data: this.getAttestationTypedData(params)
    };
  }

  public async verifyAttestationTypedDataRequest(
    attester: string,
    request: EIP712AttestationTypedDataRequest,
    verifyMessage: VerifyMessage
  ): Promise<boolean> {
    const digest = this.getAttestationDigest(request.data.message);
    const recoveredAddress = await verifyMessage(Buffer.from(digest.slice(2), "hex"), {
      v: request.v,
      s: request.s,
      r: request.r
    });

    return attester === recoveredAddress;
  }

  public async getRevocationRequest(
    params: EIP712RevocationParams,
    signMessage: SignMessage
  ): Promise<EIP712RevocationRequest> {
    const digest = this.getRevocationDigest(params);
    const { v, r, s } = await signMessage(Buffer.from(digest.slice(2), "hex"));

    return { v, r, s, params };
  }

  public async verifyRevocationRequest(
    attester: string,
    request: EIP712RevocationRequest,
    verifyMessage: VerifyMessage
  ): Promise<boolean> {
    const digest = this.getRevocationDigest(request.params);
    const recoveredAddress = await verifyMessage(Buffer.from(digest.slice(2), "hex"), {
      v: request.v,
      s: request.s,
      r: request.r
    });

    return attester === recoveredAddress;
  }

  public getRevocationTypedData(params: EIP712RevocationParams): EIP712RevocationTypedData {
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

  public async getRevocationTypedDataRequest(
    params: EIP712RevocationParams,
    signMessage: SignMessage
  ): Promise<EIP712RevocationTypedDataRequest> {
    const digest = this.getRevocationDigest(params);
    const { v, r, s } = await signMessage(Buffer.from(digest.slice(2), "hex"));

    return {
      v,
      r,
      s,
      data: this.getRevocationTypedData(params)
    };
  }

  public async verifyRevocationTypedDataRequest(
    attester: string,
    request: EIP712RevocationTypedDataRequest,
    verifyMessage: VerifyMessage
  ): Promise<boolean> {
    const digest = this.getRevocationDigest(request.data.message);
    const recoveredAddress = await verifyMessage(Buffer.from(digest.slice(2), "hex"), {
      v: request.v,
      s: request.s,
      r: request.r
    });

    return attester === recoveredAddress;
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
              ["bytes32", "address", "uint256", "uint256", "bytes32", "bytes", "uint256"],
              [
                keccak256(toUtf8Bytes(ATTEST_TYPED_SIGNATURE)),
                params.recipient,
                params.ao,
                params.expirationTime,
                params.refUUID,
                params.data,
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
}
