import { EAS__factory } from '@ethereum-attestation-service/eas-contracts';
import { Interface } from '@ethersproject/abi';
import { constants, utils } from 'ethers';
const { solidityKeccak256, hexlify, toUtf8Bytes } = utils;
const { AddressZero } = constants;
export const ZERO_ADDRESS = AddressZero;
export const ZERO_BYTES = '0x';
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const getSchemaUID = (schema, resolverAddress, revocable) => solidityKeccak256(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);
export const getUID = (schema, recipient, attester, time, expirationTime, revocable, refUID, data, bump) => solidityKeccak256(['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'], [hexlify(toUtf8Bytes(schema)), recipient, attester, time, expirationTime, revocable, refUID, data, bump]);
export const getOffchainUID = (schema, recipient, time, expirationTime, revocable, refUID, data) => solidityKeccak256(['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'], [hexlify(toUtf8Bytes(schema)), recipient, ZERO_ADDRESS, time, expirationTime, revocable, refUID, data, 0]);
export const getUIDsFromMultiAttestTx = async (res) => {
    const receipt = await (await res).wait();
    return getUIDsFromAttestEvents(receipt.events);
};
export const getUIDFromAttestTx = async (res) => {
    return (await getUIDsFromMultiAttestTx(res))[0];
};
export const getUIDFromMultiDelegatedProxyAttestTx = async (res) => {
    return getUIDFromMultiDelegatedProxyAttestReceipt((await res).wait());
};
export const getUIDFromMultiDelegatedProxyAttestReceipt = async (res) => {
    const receipt = await res;
    // eslint-disable-next-line camelcase
    const eas = new Interface(EAS__factory.abi);
    const events = [];
    for (const event of receipt.events || []) {
        events.push({
            event: 'Attested',
            args: await eas.decodeEventLog('Attested', event.data, event.topics)
        });
    }
    return getUIDsFromAttestEvents(events);
};
export const getUIDFromDelegatedProxyAttestTx = async (res) => {
    return (await getUIDFromMultiDelegatedProxyAttestTx(res))[0];
};
export const getUIDFromDelegatedProxyAttestReceipt = async (res) => {
    return (await getUIDFromMultiDelegatedProxyAttestReceipt(res))[0];
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUIDsFromAttestEvents = (events) => {
    if (!events) {
        return [];
    }
    const attestedEvents = events.filter((e) => e.event === 'Attested');
    if (attestedEvents.length === 0) {
        throw new Error('Unable to process attestation events');
    }
    return attestedEvents.map((event) => event.args?.uid);
};
export const getTimestampFromTimestampEvents = (events) => {
    if (!events) {
        return [];
    }
    const timestampedEvents = events.filter((e) => e.event === 'Timestamped');
    if (timestampedEvents.length === 0) {
        throw new Error('Unable to process attestation events');
    }
    return timestampedEvents.map((event) => event.args?.timestamp);
};
export const getTimestampFromOffchainRevocationEvents = (events) => {
    if (!events) {
        return [];
    }
    const revocationEvents = events.filter((e) => e.event === 'RevokedOffchain');
    if (revocationEvents.length === 0) {
        throw new Error('Unable to process offchain revocation events');
    }
    return revocationEvents.map((event) => event.args?.timestamp);
};
//# sourceMappingURL=utils.js.map