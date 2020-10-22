"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxy = exports.EIP712_NAME = exports.EIP712_DOMAIN = exports.REVOKE_TYPE = exports.ATTEST_TYPE = void 0;
var tslib_1 = require("tslib");
var keccak256_1 = require("@ethersproject/keccak256");
var abi_1 = require("@ethersproject/abi");
var strings_1 = require("@ethersproject/strings");
var solidity_1 = require("@ethersproject/solidity");
exports.ATTEST_TYPE = "Attest(address recipient,uint256 ao,uint256 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)";
exports.REVOKE_TYPE = "Revoke(byte32 uuid,uint256 nonce)";
exports.EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
exports.EIP712_NAME = "EAS";
var Proxy = /** @class */ (function () {
    function Proxy(eip712Config) {
        this.eip712Config = eip712Config;
    }
    Proxy.prototype.getDomainSeparator = function () {
        return keccak256_1.keccak256(abi_1.defaultAbiCoder.encode(["bytes32", "bytes32", "bytes32", "uint256", "address"], [
            keccak256_1.keccak256(strings_1.toUtf8Bytes(exports.EIP712_DOMAIN)),
            keccak256_1.keccak256(strings_1.toUtf8Bytes(exports.EIP712_NAME)),
            keccak256_1.keccak256(strings_1.toUtf8Bytes(this.eip712Config.version)),
            this.eip712Config.chainId,
            this.eip712Config.address
        ]));
    };
    Proxy.prototype.getAttestationRequest = function (params, signMessage) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var digest, _a, v, r, s;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        digest = this.getAttestationDigest(params);
                        return [4 /*yield*/, signMessage(Buffer.from(digest.slice(2), "hex"))];
                    case 1:
                        _a = _b.sent(), v = _a.v, r = _a.r, s = _a.s;
                        return [2 /*return*/, { v: v, r: r, s: s, digest: digest, params: params }];
                }
            });
        });
    };
    Proxy.prototype.verifyAttestationRequest = function (attester, params, verifyMessage) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var digest, recoveredAddress;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        digest = this.getAttestationDigest(params.params);
                        if (digest !== params.digest) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, verifyMessage(Buffer.from(digest.slice(2), "hex"), {
                                v: params.v,
                                s: params.s,
                                r: params.r
                            })];
                    case 1:
                        recoveredAddress = _a.sent();
                        return [2 /*return*/, attester === recoveredAddress];
                }
            });
        });
    };
    Proxy.prototype.getRevocationRequest = function (params, signMessage) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var digest, _a, v, r, s;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        digest = this.getRevocationDigest(params);
                        return [4 /*yield*/, signMessage(Buffer.from(digest.slice(2), "hex"))];
                    case 1:
                        _a = _b.sent(), v = _a.v, r = _a.r, s = _a.s;
                        return [2 /*return*/, { v: v, r: r, s: s, digest: digest, params: params }];
                }
            });
        });
    };
    Proxy.prototype.verifyRevocationRequest = function (attester, params, verifyMessage) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var digest, recoveredAddress;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        digest = this.getRevocationDigest(params.params);
                        if (digest !== params.digest) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, verifyMessage(Buffer.from(digest.slice(2), "hex"), {
                                v: params.v,
                                s: params.s,
                                r: params.r
                            })];
                    case 1:
                        recoveredAddress = _a.sent();
                        return [2 /*return*/, attester === recoveredAddress];
                }
            });
        });
    };
    Proxy.prototype.getAttestationDigest = function (params) {
        return keccak256_1.keccak256(solidity_1.pack(["bytes1", "bytes1", "bytes32", "bytes32"], [
            "0x19",
            "0x01",
            this.getDomainSeparator(),
            keccak256_1.keccak256(abi_1.defaultAbiCoder.encode(["bytes32", "address", "uint256", "uint256", "bytes32", "bytes", "uint256"], [
                keccak256_1.keccak256(strings_1.toUtf8Bytes(exports.ATTEST_TYPE)),
                params.recipient,
                params.ao,
                params.expirationTime,
                params.refUUID,
                Buffer.from(params.data.slice(2), "hex"),
                params.nonce
            ]))
        ]));
    };
    Proxy.prototype.getRevocationDigest = function (params) {
        return keccak256_1.keccak256(solidity_1.pack(["bytes1", "bytes1", "bytes32", "bytes32"], [
            "0x19",
            "0x01",
            this.getDomainSeparator(),
            keccak256_1.keccak256(abi_1.defaultAbiCoder.encode(["bytes32", "bytes32", "uint256"], [keccak256_1.keccak256(strings_1.toUtf8Bytes(exports.REVOKE_TYPE)), params.uuid, params.nonce]))
        ]));
    };
    return Proxy;
}());
exports.Proxy = Proxy;
//# sourceMappingURL=proxy.js.map