"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delegation = exports.REVOKE_TYPE = exports.ATTEST_TYPE = exports.DOMAIN_TYPE = exports.REVOKE_PRIMARY_TYPE = exports.ATTEST_PRIMARY_TYPE = exports.EIP712_NAME = exports.EIP712_DOMAIN = exports.REVOKE_TYPED_SIGNATURE = exports.ATTEST_TYPED_SIGNATURE = void 0;
var tslib_1 = require("tslib");
var ethers_1 = require("ethers");
var keccak256 = ethers_1.utils.keccak256, getAddress = ethers_1.utils.getAddress, toUtf8Bytes = ethers_1.utils.toUtf8Bytes, defaultAbiCoder = ethers_1.utils.defaultAbiCoder, solidityPack = ethers_1.utils.solidityPack;
exports.ATTEST_TYPED_SIGNATURE = "Attest(address recipient,bytes32 schema,uint256 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)";
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
    { name: "schema", type: "bytes32" },
    { name: "expirationTime", type: "uint256" },
    { name: "refUUID", type: "bytes32" },
    { name: "data", type: "bytes" },
    { name: "nonce", type: "uint256" }
];
exports.REVOKE_TYPE = [
    { name: "uuid", type: "bytes32" },
    { name: "nonce", type: "uint256" }
];
var Delegation = /** @class */ (function () {
    function Delegation(eip712Config) {
        this.eip712Config = eip712Config;
    }
    Delegation.prototype.getDomainSeparator = function () {
        return keccak256(defaultAbiCoder.encode(["bytes32", "bytes32", "bytes32", "uint256", "address"], [
            keccak256(toUtf8Bytes(exports.EIP712_DOMAIN)),
            keccak256(toUtf8Bytes(exports.EIP712_NAME)),
            keccak256(toUtf8Bytes(this.eip712Config.version)),
            this.eip712Config.chainId,
            this.eip712Config.address
        ]));
    };
    Delegation.prototype.getDomainTypedData = function () {
        return {
            name: exports.EIP712_NAME,
            version: this.eip712Config.version,
            chainId: this.eip712Config.chainId,
            verifyingContract: this.eip712Config.address
        };
    };
    Delegation.prototype.getAttestationRequest = function (params, signData) {
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
    Delegation.prototype.verifyAttestationRequest = function (attester, request, verifyData) {
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
                        return [2 /*return*/, getAddress(attester) === getAddress(recoveredAddress)];
                }
            });
        });
    };
    Delegation.prototype.getAttestationTypedDataRequest = function (params, signTypedData) {
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
    Delegation.prototype.verifyAttestationTypedDataRequest = function (attester, request, verifyTypedData) {
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
                        return [2 /*return*/, getAddress(attester) === getAddress(recoveredAddress)];
                }
            });
        });
    };
    Delegation.prototype.getRevocationRequest = function (params, signData) {
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
    Delegation.prototype.verifyRevocationRequest = function (attester, request, verifyData) {
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
                        return [2 /*return*/, getAddress(attester) === getAddress(recoveredAddress)];
                }
            });
        });
    };
    Delegation.prototype.getRevocationTypedDataRequest = function (params, signTypedData) {
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
    Delegation.prototype.verifyRevocationTypedDataRequest = function (attester, request, verifyTypedData) {
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
                        return [2 /*return*/, getAddress(attester) === getAddress(recoveredAddress)];
                }
            });
        });
    };
    Delegation.prototype.getAttestationDigest = function (params) {
        return keccak256(solidityPack(["bytes1", "bytes1", "bytes32", "bytes32"], [
            "0x19",
            "0x01",
            this.getDomainSeparator(),
            keccak256(defaultAbiCoder.encode(["bytes32", "address", "bytes32", "uint256", "bytes32", "bytes32", "uint256"], [
                keccak256(toUtf8Bytes(exports.ATTEST_TYPED_SIGNATURE)),
                params.recipient,
                params.schema,
                params.expirationTime,
                params.refUUID,
                keccak256(params.data),
                params.nonce
            ]))
        ]));
    };
    Delegation.prototype.getRevocationDigest = function (params) {
        return keccak256(solidityPack(["bytes1", "bytes1", "bytes32", "bytes32"], [
            "0x19",
            "0x01",
            this.getDomainSeparator(),
            keccak256(defaultAbiCoder.encode(["bytes32", "bytes32", "uint256"], [keccak256(toUtf8Bytes(exports.REVOKE_TYPED_SIGNATURE)), params.uuid, params.nonce]))
        ]));
    };
    Delegation.prototype.getAttestationTypedData = function (params) {
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
    Delegation.prototype.getRevocationTypedData = function (params) {
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
    return Delegation;
}());
exports.Delegation = Delegation;
//# sourceMappingURL=delegation.js.map