"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUUIDFromMultiAttestTx = exports.getUUIDFromAttestTx = exports.getOffchainUUID = exports.getUUID = exports.getSchemaUUID = exports.ZERO_BYTES32 = exports.ZERO_BYTES = exports.ZERO_ADDRESS = void 0;
const ethers_1 = require("ethers");
const { solidityKeccak256, hexlify, toUtf8Bytes } = ethers_1.utils;
const { AddressZero } = ethers_1.constants;
exports.ZERO_ADDRESS = AddressZero;
exports.ZERO_BYTES = '0x';
exports.ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
const getSchemaUUID = (schema, resolverAddress, revocable) => solidityKeccak256(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);
exports.getSchemaUUID = getSchemaUUID;
const getUUID = (schema, recipient, attester, time, expirationTime, revocable, refUUID, data, bump) => solidityKeccak256(['bytes', 'address', 'address', 'uint32', 'uint32', 'bool', 'bytes32', 'bytes', 'uint32'], [hexlify(toUtf8Bytes(schema)), recipient, attester, time, expirationTime, revocable, refUUID, data, bump]);
exports.getUUID = getUUID;
const getOffchainUUID = (schema, recipient, time, expirationTime, revocable, refUUID, data) => solidityKeccak256(['bytes', 'address', 'address', 'uint32', 'uint32', 'bool', 'bytes32', 'bytes', 'uint32'], [hexlify(toUtf8Bytes(schema)), recipient, exports.ZERO_ADDRESS, time, expirationTime, revocable, refUUID, data, 0]);
exports.getOffchainUUID = getOffchainUUID;
const getUUIDFromAttestTx = async (res) => {
    const receipt = await (await res).wait();
    const event = receipt.events?.find((e) => e.event === 'Attested');
    if (!event) {
        throw new Error('Unable to process attestation event');
    }
    return event.args?.uuid;
};
exports.getUUIDFromAttestTx = getUUIDFromAttestTx;
const getUUIDFromMultiAttestTx = async (res) => {
    const receipt = await (await res).wait();
    const events = receipt.events?.filter((e) => e.event === 'Attested');
    if (!events || events?.length === 0) {
        throw new Error('Unable to process attestation event');
    }
    return events.map((event) => event.args?.uuid);
};
exports.getUUIDFromMultiAttestTx = getUUIDFromMultiAttestTx;
//# sourceMappingURL=utils.js.map