import { EAS__factory } from '@ethereum-attestation-service/eas-contracts';
import { Interface } from '@ethersproject/abi';
import {BigNumberish, constants, ContractReceipt, ContractTransaction, Event, utils} from 'ethers';

const { solidityKeccak256, hexlify, toUtf8Bytes } = utils;

const { AddressZero } = constants;

export const ZERO_ADDRESS = AddressZero;
export const ZERO_BYTES = '0x';
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

export const getSchemaUID = (schema: string, resolverAddress: string, revocable: boolean) =>
  solidityKeccak256(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);

export const getUID = (
  schema: string,
  recipient: string,
  attester: string,
  time: BigNumberish,
  expirationTime: BigNumberish,
  revocable: boolean,
  refUID: string,
  data: string,
  bump: number
) =>
  solidityKeccak256(
    ['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
    [hexlify(toUtf8Bytes(schema)), recipient, attester, time, expirationTime, revocable, refUID, data, bump]
  );

export const getOffchainUID = (
  version: number,
  schema: string,
  recipient: string,
  time: BigNumberish,
  expirationTime: BigNumberish,
  revocable: boolean,
  refUID: string,
  data: string
) => {
  switch (version) {
    case 0:
      return solidityKeccak256(
        ['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
        [hexlify(toUtf8Bytes(schema)), recipient, ZERO_ADDRESS, time, expirationTime, revocable, refUID, data, 0]
      );

    case 1:
      return solidityKeccak256(
        ['uint16', 'bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
        [
          version,
          hexlify(toUtf8Bytes(schema)),
          recipient,
          ZERO_ADDRESS,
          time,
          expirationTime,
          revocable,
          refUID,
          data,
          0
        ]
      );

    default:
      throw new Error('Unsupported version');
  }
};

export const getUIDsFromMultiAttestTx = async (
  res: Promise<ContractTransaction> | ContractTransaction
): Promise<string[]> => {
  const receipt = await (await res).wait();

  return getUIDsFromAttestEvents(receipt.events);
};

export const getUIDFromAttestTx = async (res: Promise<ContractTransaction> | ContractTransaction): Promise<string> => {
  return (await getUIDsFromMultiAttestTx(res))[0];
};

export const getUIDFromMultiDelegatedProxyAttestTx = async (
  res: Promise<ContractTransaction> | ContractTransaction
): Promise<string[]> => {
  return getUIDFromMultiDelegatedProxyAttestReceipt((await res).wait());
};

export const getUIDFromMultiDelegatedProxyAttestReceipt = async (
  res: Promise<ContractReceipt> | ContractReceipt
): Promise<string[]> => {
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

export const getUIDFromDelegatedProxyAttestTx = async (
  res: Promise<ContractTransaction> | ContractTransaction
): Promise<string> => {
  return (await getUIDFromMultiDelegatedProxyAttestTx(res))[0];
};

export const getUIDFromDelegatedProxyAttestReceipt = async (
  res: Promise<ContractReceipt> | ContractReceipt
): Promise<string> => {
  return (await getUIDFromMultiDelegatedProxyAttestReceipt(res))[0];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUIDsFromAttestEvents = (events?: ReadonlyArray<any>): string[] => {
  if (!events) {
    return [];
  }

  const attestedEvents = events.filter((e) => e.event === 'Attested');
  if (attestedEvents.length === 0) {
    throw new Error('Unable to process attestation events');
  }

  return attestedEvents.map((event) => event.args?.uid);
};

export const getTimestampFromTimestampEvents = (events?: Event[]): BigNumberish[] => {
  if (!events) {
    return [];
  }

  const timestampedEvents = events.filter((e) => e.event === 'Timestamped');
  if (timestampedEvents.length === 0) {
    throw new Error('Unable to process attestation events');
  }

  return timestampedEvents.map((event) => event.args?.timestamp);
};

export const getTimestampFromOffchainRevocationEvents = (events?: Event[]): BigNumberish[] => {
  if (!events) {
    return [];
  }

  const revocationEvents = events.filter((e) => e.event === 'RevokedOffchain');
  if (revocationEvents.length === 0) {
    throw new Error('Unable to process offchain revocation events');
  }

  return revocationEvents.map((event) => event.args?.timestamp);
};

