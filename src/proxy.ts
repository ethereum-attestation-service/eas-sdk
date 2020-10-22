import { keccak256 } from "@ethersproject/keccak256";
import { defaultAbiCoder } from "@ethersproject/abi";
import { toUtf8Bytes } from "@ethersproject/strings";
import { pack } from "@ethersproject/solidity";

export const ATTEST_TYPE =
  "Attest(address recipient,uint256 ao,uint256 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)";
export const REVOKE_TYPE = "Revoke(byte32 uuid,uint256 nonce)";
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
  data: string;
}

export interface EIP712RevocationParams extends EIP712Params {
  uuid: string;
}

export interface EIP712Request {
  v: number;
  r: string;
  s: string;
  digest: string;
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

export class Proxy {
  private eip712Config: EIP712Config;

  public constructor(eip712Config: EIP712Config) {
    this.eip712Config = eip712Config;
  }

  public async getAttestationRequest(
    params: EIP712AttestationParams,
    signMessage: SignMessage
  ): Promise<EIP712AttestationRequest> {
    const digest = this.getAttestationDigest(params);
    const { v, r, s } = await signMessage(Buffer.from(digest.slice(2), "hex"));

    return { v, r, s, digest, params };
  }

  public async verifyAttestationRequest(
    attester: string,
    params: EIP712AttestationRequest,
    verifyMessage: VerifyMessage
  ): Promise<boolean> {
    const digest = this.getAttestationDigest(params.params);
    if (digest !== params.digest) {
      return false;
    }

    const recoveredAddress = await verifyMessage(Buffer.from(digest.slice(2), "hex"), {
      v: params.v,
      s: params.s,
      r: params.r
    });

    return attester === recoveredAddress;
  }

  public async getRevocationRequest(
    params: EIP712RevocationParams,
    signMessage: SignMessage
  ): Promise<EIP712RevocationRequest> {
    const digest = this.getRevocationDigest(params);
    const { v, r, s } = await signMessage(Buffer.from(digest.slice(2), "hex"));

    return { v, r, s, digest, params };
  }

  public async verifyRevocationRequest(
    attester: string,
    params: EIP712RevocationRequest,
    verifyMessage: VerifyMessage
  ): Promise<boolean> {
    const digest = this.getRevocationDigest(params.params);
    if (digest !== params.digest) {
      return false;
    }

    const recoveredAddress = await verifyMessage(Buffer.from(digest.slice(2), "hex"), {
      v: params.v,
      s: params.s,
      r: params.r
    });

    return attester === recoveredAddress;
  }

  private getDomainSeparator() {
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
                keccak256(toUtf8Bytes(ATTEST_TYPE)),
                params.recipient,
                params.ao,
                params.expirationTime,
                params.refUUID,
                Buffer.from(params.data.slice(2), "hex"),
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
              [keccak256(toUtf8Bytes(REVOKE_TYPE)), params.uuid, params.nonce]
            )
          )
        ]
      )
    );
  }
}
