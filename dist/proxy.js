"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxy = exports.REVOKE_TYPE = exports.ATTEST_TYPE = exports.DOMAIN_TYPE = exports.REVOKE_PRIMARY_TYPE = exports.ATTEST_PRIMARY_TYPE = exports.EIP712_NAME = exports.EIP712_DOMAIN = exports.REVOKE_TYPED_SIGNATURE = exports.ATTEST_TYPED_SIGNATURE = void 0;
var tslib_1 = require("tslib");
var keccak256_1 = require("@ethersproject/keccak256");
var abi_1 = require("@ethersproject/abi");
var strings_1 = require("@ethersproject/strings");
var solidity_1 = require("@ethersproject/solidity");
var address_1 = require("@ethersproject/address");
exports.ATTEST_TYPED_SIGNATURE = "Attest(address recipient,uint256 ao,uint256 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)";
exports.REVOKE_TYPED_SIGNATURE = "Revoke(bytes32 uuid,uint256 nonce)";
exports.EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
exports.EIP712_NAME = "EAS";
exports.ATTEST_PRIMARY_TYPE = "Attest";
exports.REVOKE_PRIMARY_TYPE = "Revoke";
exports.DOMAIN_TYPE = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" }
];
exports.ATTEST_TYPE = [
    { name: "recipient", type: "address" },
    { name: "ao", type: "uint256" },
    { name: "expirationTime", type: "uint256" },
    { name: "refUUID", type: "bytes32" },
    { name: "data", type: "bytes" },
    { name: "nonce", type: "uint256" }
];
exports.REVOKE_TYPE = [
    { name: "uuid", type: "bytes32" },
    { name: "nonce", type: "uint256" }
];
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
    Proxy.prototype.getDomainTypedData = function () {
        return {
            name: exports.EIP712_NAME,
            version: this.eip712Config.version,
            chainId: this.eip712Config.chainId,
            verifyingContract: this.eip712Config.address
        };
    };
    Proxy.prototype.getAttestationRequest = function (params, signData) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var digest, _a, v, r, s;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        digest = this.getAttestationDigest(params);
                        return [4 /*yield*/, signData(Buffer.from(digest.slice(2), "hex"))];
                    case 1:
                        _a = _b.sent(), v = _a.v, r = _a.r, s = _a.s;
                        return [2 /*return*/, { v: v, r: r, s: s, params: params }];
                }
            });
        });
    };
    Proxy.prototype.verifyAttestationRequest = function (attester, request, verifyData) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var digest, recoveredAddress;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        digest = this.getAttestationDigest(request.params);
                        return [4 /*yield*/, verifyData(Buffer.from(digest.slice(2), "hex"), {
                                v: request.v,
                                s: request.s,
                                r: request.r
                            })];
                    case 1:
                        recoveredAddress = _a.sent();
                        return [2 /*return*/, address_1.getAddress(attester) === address_1.getAddress(recoveredAddress)];
                }
            });
        });
    };
    Proxy.prototype.getAttestationTypedDataRequest = function (params, signTypedData) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data, _a, v, r, s;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        data = this.getAttestationTypedData(params);
                        return [4 /*yield*/, signTypedData(data)];
                    case 1:
                        _a = _b.sent(), v = _a.v, r = _a.r, s = _a.s;
                        return [2 /*return*/, {
                                v: v,
                                r: r,
                                s: s,
                                data: data
                            }];
                }
            });
        });
    };
    Proxy.prototype.verifyAttestationTypedDataRequest = function (attester, request, verifyTypedData) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var recoveredAddress;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, verifyTypedData(request.data, {
                            v: request.v,
                            s: request.s,
                            r: request.r
                        })];
                    case 1:
                        recoveredAddress = _a.sent();
                        return [2 /*return*/, address_1.getAddress(attester) === address_1.getAddress(recoveredAddress)];
                }
            });
        });
    };
    Proxy.prototype.getRevocationRequest = function (params, signData) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var digest, _a, v, r, s;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        digest = this.getRevocationDigest(params);
                        return [4 /*yield*/, signData(Buffer.from(digest.slice(2), "hex"))];
                    case 1:
                        _a = _b.sent(), v = _a.v, r = _a.r, s = _a.s;
                        return [2 /*return*/, { v: v, r: r, s: s, params: params }];
                }
            });
        });
    };
    Proxy.prototype.verifyRevocationRequest = function (attester, request, verifyData) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var digest, recoveredAddress;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        digest = this.getRevocationDigest(request.params);
                        return [4 /*yield*/, verifyData(Buffer.from(digest.slice(2), "hex"), {
                                v: request.v,
                                s: request.s,
                                r: request.r
                            })];
                    case 1:
                        recoveredAddress = _a.sent();
                        return [2 /*return*/, address_1.getAddress(attester) === address_1.getAddress(recoveredAddress)];
                }
            });
        });
    };
    Proxy.prototype.getRevocationTypedDataRequest = function (params, signTypedData) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var data, _a, v, r, s;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        data = this.getRevocationTypedData(params);
                        return [4 /*yield*/, signTypedData(data)];
                    case 1:
                        _a = _b.sent(), v = _a.v, r = _a.r, s = _a.s;
                        return [2 /*return*/, {
                                v: v,
                                r: r,
                                s: s,
                                data: data
                            }];
                }
            });
        });
    };
    Proxy.prototype.verifyRevocationTypedDataRequest = function (attester, request, verifyTypedData) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var recoveredAddress;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, verifyTypedData(request.data, {
                            v: request.v,
                            s: request.s,
                            r: request.r
                        })];
                    case 1:
                        recoveredAddress = _a.sent();
                        return [2 /*return*/, address_1.getAddress(attester) === address_1.getAddress(recoveredAddress)];
                }
            });
        });
    };
    Proxy.prototype.getAttestationDigest = function (params) {
        return keccak256_1.keccak256(solidity_1.pack(["bytes1", "bytes1", "bytes32", "bytes32"], [
            "0x19",
            "0x01",
            this.getDomainSeparator(),
            keccak256_1.keccak256(abi_1.defaultAbiCoder.encode(["bytes32", "address", "uint256", "uint256", "bytes32", "bytes32", "uint256"], [
                keccak256_1.keccak256(strings_1.toUtf8Bytes(exports.ATTEST_TYPED_SIGNATURE)),
                params.recipient,
                params.ao,
                params.expirationTime,
                params.refUUID,
                keccak256_1.keccak256(params.data),
                params.nonce
            ]))
        ]));
    };
    Proxy.prototype.getRevocationDigest = function (params) {
        return keccak256_1.keccak256(solidity_1.pack(["bytes1", "bytes1", "bytes32", "bytes32"], [
            "0x19",
            "0x01",
            this.getDomainSeparator(),
            keccak256_1.keccak256(abi_1.defaultAbiCoder.encode(["bytes32", "bytes32", "uint256"], [keccak256_1.keccak256(strings_1.toUtf8Bytes(exports.REVOKE_TYPED_SIGNATURE)), params.uuid, params.nonce]))
        ]));
    };
    Proxy.prototype.getAttestationTypedData = function (params) {
        return {
            domain: this.getDomainTypedData(),
            primaryType: exports.ATTEST_PRIMARY_TYPE,
            message: params,
            types: {
                EIP712Domain: exports.DOMAIN_TYPE,
                Attest: exports.ATTEST_TYPE
            }
        };
    };
    Proxy.prototype.getRevocationTypedData = function (params) {
        return {
            domain: this.getDomainTypedData(),
            primaryType: exports.REVOKE_PRIMARY_TYPE,
            message: params,
            types: {
                EIP712Domain: exports.DOMAIN_TYPE,
                Revoke: exports.REVOKE_TYPE
            }
        };
    };
    return Proxy;
}());
exports.Proxy = Proxy;
//# sourceMappingURL=proxy.js.map