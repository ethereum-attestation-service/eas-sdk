var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { keccak256 } from "@ethersproject/keccak256";
import { defaultAbiCoder } from "@ethersproject/abi";
import { toUtf8Bytes } from "@ethersproject/strings";
import { pack } from "@ethersproject/solidity";
export const ATTEST_TYPE = "Attest(address recipient,uint256 ao,uint256 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)";
export const REVOKE_TYPE = "Revoke(byte32 uuid,uint256 nonce)";
export const EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
export const EIP712_NAME = "EAS";
export class Proxy {
    constructor(eip712Config) {
        this.eip712Config = eip712Config;
    }
    getDomainSeparator() {
        return keccak256(defaultAbiCoder.encode(["bytes32", "bytes32", "bytes32", "uint256", "address"], [
            keccak256(toUtf8Bytes(EIP712_DOMAIN)),
            keccak256(toUtf8Bytes(EIP712_NAME)),
            keccak256(toUtf8Bytes(this.eip712Config.version)),
            this.eip712Config.chainId,
            this.eip712Config.address
        ]));
    }
    getAttestationRequest(params, signMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const digest = this.getAttestationDigest(params);
            const { v, r, s } = yield signMessage(Buffer.from(digest.slice(2), "hex"));
            return { v, r, s, digest, params };
        });
    }
    verifyAttestationRequest(attester, params, verifyMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const digest = this.getAttestationDigest(params.params);
            if (digest !== params.digest) {
                return false;
            }
            const recoveredAddress = yield verifyMessage(Buffer.from(digest.slice(2), "hex"), {
                v: params.v,
                s: params.s,
                r: params.r
            });
            return attester === recoveredAddress;
        });
    }
    getRevocationRequest(params, signMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const digest = this.getRevocationDigest(params);
            const { v, r, s } = yield signMessage(Buffer.from(digest.slice(2), "hex"));
            return { v, r, s, digest, params };
        });
    }
    verifyRevocationRequest(attester, params, verifyMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const digest = this.getRevocationDigest(params.params);
            if (digest !== params.digest) {
                return false;
            }
            const recoveredAddress = yield verifyMessage(Buffer.from(digest.slice(2), "hex"), {
                v: params.v,
                s: params.s,
                r: params.r
            });
            return attester === recoveredAddress;
        });
    }
    getAttestationDigest(params) {
        return keccak256(pack(["bytes1", "bytes1", "bytes32", "bytes32"], [
            "0x19",
            "0x01",
            this.getDomainSeparator(),
            keccak256(defaultAbiCoder.encode(["bytes32", "address", "uint256", "uint256", "bytes32", "bytes", "uint256"], [
                keccak256(toUtf8Bytes(ATTEST_TYPE)),
                params.recipient,
                params.ao,
                params.expirationTime,
                params.refUUID,
                Buffer.from(params.data.slice(2), "hex"),
                params.nonce
            ]))
        ]));
    }
    getRevocationDigest(params) {
        return keccak256(pack(["bytes1", "bytes1", "bytes32", "bytes32"], [
            "0x19",
            "0x01",
            this.getDomainSeparator(),
            keccak256(defaultAbiCoder.encode(["bytes32", "bytes32", "uint256"], [keccak256(toUtf8Bytes(REVOKE_TYPE)), params.uuid, params.nonce]))
        ]));
    }
}
