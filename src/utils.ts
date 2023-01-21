import { BigNumberish, constants, ContractTransaction, Event, utils } from 'ethers';

const { solidityKeccak256, hexlify, toUtf8Bytes } = utils;

const { AddressZero } = constants;

export const ZERO_ADDRESS = AddressZero;
export const ZERO_BYTES = '0x';
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

export const getSchemaUUID = (schema: string, resolverAddress: string, revocable: boolean) =>
  solidityKeccak256(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);

export const getUUID = (
  schema: string,
  recipient: string,
  attester: string,
  time: BigNumberish,
  expirationTime: BigNumberish,
  revocable: boolean,
  refUUID: string,
  data: string,
  bump: number
) =>
  solidityKeccak256(
    ['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
    [hexlify(toUtf8Bytes(schema)), recipient, attester, time, expirationTime, revocable, refUUID, data, bump]
  );

export const getOffchainUUID = (
  schema: string,
  recipient: string,
  time: BigNumberish,
  expirationTime: BigNumberish,
  revocable: boolean,
  refUUID: string,
  data: string
) =>
  solidityKeccak256(
    ['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
    [hexlify(toUtf8Bytes(schema)), recipient, ZERO_ADDRESS, time, expirationTime, revocable, refUUID, data, 0]
  );

export const getUUIDFromAttestTx = async (res: Promise<ContractTransaction> | ContractTransaction) => {
  const receipt = await (await res).wait();
  const event = receipt.events?.find((e) => e.event === 'Attested');
  if (!event) {
    throw new Error('Unable to process attestation event');
  }
  return event.args?.uuid;
};

export const getUUIDsFromMultiAttestTx = async (res: Promise<ContractTransaction> | ContractTransaction) => {
  const receipt = await (await res).wait();
  const events = receipt.events?.filter((e) => e.event === 'Attested');
  if (!events || events?.length === 0) {
    throw new Error('Unable to process attestation event');
  }

  return events.map((event) => event.args?.uuid);
};

export const getUUIDsFromAttestEvents = (events?: Event[]): string[] => {
  if (!events) {
    return [];
  }

  const attestedEvents = events.filter((e) => e.event === 'Attested');
  if (attestedEvents.length === 0) {
    throw new Error('Unable to process attestation events');
  }

  return attestedEvents.map((event) => event.args?.uuid);
};
