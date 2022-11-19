import { constants, utils } from 'ethers';

const { solidityKeccak256 } = utils;

const { AddressZero } = constants;

export const ZERO_ADDRESS = AddressZero;
export const ZERO_BYTES = '0x';
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

export const getSchemaUUID = (schema: string, resolverAddress: string) =>
  solidityKeccak256(['string', 'address'], [schema, resolverAddress]);

export const getUUID = (
  schema: string,
  recipient: string,
  attester: string,
  time: number,
  expirationTime: number,
  data: string,
  bump: number
) =>
  solidityKeccak256(
    ['bytes', 'address', 'address', 'uint32', 'uint32', 'bytes', 'uint32'],
    [schema, recipient, attester, time, expirationTime, data, bump]
  );
