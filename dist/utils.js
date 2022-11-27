"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOffchainUUID = exports.getUUID = exports.getSchemaUUID = exports.ZERO_BYTES32 = exports.ZERO_BYTES = exports.ZERO_ADDRESS = void 0;
const ethers_1 = require("ethers");
const { solidityKeccak256, hexlify, toUtf8Bytes } = ethers_1.utils;
const { AddressZero } = ethers_1.constants;
exports.ZERO_ADDRESS = AddressZero;
exports.ZERO_BYTES = '0x';
exports.ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
const getSchemaUUID = (schema, resolverAddress) => solidityKeccak256(['string', 'address'], [schema, resolverAddress]);
exports.getSchemaUUID = getSchemaUUID;
const getUUID = (schema, recipient, attester, time, expirationTime, refUUID, data, bump) => solidityKeccak256(['bytes', 'address', 'address', 'uint32', 'uint32', 'bytes32', 'bytes', 'uint32'], [hexlify(toUtf8Bytes(schema)), recipient, attester, time, expirationTime, refUUID, data, bump]);
exports.getUUID = getUUID;
const getOffchainUUID = (schema, recipient, time, expirationTime, refUUID, data) => solidityKeccak256(['bytes', 'address', 'address', 'uint32', 'uint32', 'bytes32', 'bytes', 'uint32'], [hexlify(toUtf8Bytes(schema)), recipient, exports.ZERO_ADDRESS, time, expirationTime, refUUID, data, 0]);
exports.getOffchainUUID = getOffchainUUID;
//# sourceMappingURL=utils.js.map