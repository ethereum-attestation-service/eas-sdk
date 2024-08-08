import { hexlify, solidityPackedKeccak256, toUtf8Bytes } from 'ethers';
import { getSchemaUID, getUID } from '../../src/utils';
import { ZERO_ADDRESS, ZERO_BYTES32 } from '../utils/Constants';
import chai from './helpers/chai';

const { expect } = chai;

describe('utils', () => {
  describe('uid', () => {
    for (const schema of [
      'bool like',
      'address contractAddress,bool trusted',
      'bytes32 eventId,uint8 ticketType,uint32 ticketNum'
    ]) {
      for (const recipient of [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        ZERO_ADDRESS
      ]) {
        for (const attester of [
          '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
        ]) {
          for (const time of [1n, 12345n, 1669299342n]) {
            for (const expirationTime of [0n, 1669299342n]) {
              for (const revocable of [true, false]) {
                for (const refUID of [
                  ZERO_BYTES32,
                  '0x7465737400000000000000000000000000000000000000000000000000000000'
                ]) {
                  for (const data of [ZERO_BYTES32, '0x1234']) {
                    for (const bump of [0, 1, 2]) {
                      context(
                        // eslint-disable-next-line max-len
                        `schema=${schema},recipient=${recipient},attester=${attester},time=${time},expirationTime=${expirationTime},revocable=${revocable},data=${data},bump=${bump}`,
                        () => {
                          it('should properly derive uid', () => {
                            expect(
                              getUID(schema, recipient, attester, time, expirationTime, revocable, refUID, data, bump)
                            ).to.equal(
                              solidityPackedKeccak256(
                                [
                                  'bytes',
                                  'address',
                                  'address',
                                  'uint64',
                                  'uint64',
                                  'bool',
                                  'bytes32',
                                  'bytes',
                                  'uint32'
                                ],
                                [
                                  hexlify(toUtf8Bytes(schema)),
                                  recipient,
                                  attester,
                                  time,
                                  expirationTime,
                                  revocable,
                                  refUID,
                                  data,
                                  bump
                                ]
                              )
                            );
                          });
                        }
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  describe('schema uid', () => {
    for (const schema of [
      'bool like',
      'address contractAddress,bool trusted',
      'bytes32 eventId,uint8 ticketType,uint32 ticketNum'
    ]) {
      for (const resolver of [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        ZERO_ADDRESS
      ]) {
        for (const revocable of [true, false]) {
          context(`schema=${schema},resolver=${resolver}},revocable=${revocable}`, () => {
            it('should properly derive uid', () => {
              expect(getSchemaUID(schema, resolver, revocable)).to.equal(
                solidityPackedKeccak256(['string', 'address', 'bool'], [schema, resolver, revocable])
              );
            });
          });
        }
      }
    }
  });
});
