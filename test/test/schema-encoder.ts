import { SchemaEncoder } from '../../src/schema-encoder';
import { ZERO_ADDRESS } from '../utils/Constants';
import chai from './helpers/chai';
import { utils } from 'ethers';

const { defaultAbiCoder } = utils;

const { expect } = chai;

describe('SchemaEncoder', () => {
  describe('construction', () => {
    for (const { schema, decodedSchema } of [
      {
        schema: 'bool like',
        decodedSchema: [
          {
            name: 'like',
            type: 'bool',
            value: false
          }
        ]
      },
      {
        schema: 'address contractAddress,bool trusted',
        decodedSchema: [
          {
            name: 'contractAddress',
            type: 'address',
            value: ZERO_ADDRESS
          },
          {
            name: 'trusted',
            type: 'bool',
            value: false
          }
        ]
      },
      {
        schema: 'bytes32 eventId,uint8 ticketType,uint32 ticketNum',
        decodedSchema: [
          {
            name: 'eventId',
            type: 'bytes32',
            value: ''
          },
          {
            name: 'ticketType',
            type: 'uint8',
            value: '0'
          },
          {
            name: 'ticketNum',
            type: 'uint32',
            value: '0'
          }
        ]
      },
      {
        schema: 'bytes32,uint8,uint32',
        decodedSchema: [
          {
            name: null,
            type: 'bytes32',
            value: ''
          },
          {
            name: null,
            type: 'uint8',
            value: '0'
          },
          {
            name: null,
            type: 'uint32',
            value: '0'
          }
        ]
      }
    ]) {
      context(schema, () => {
        it('should properly construct a schema encoder', async () => {
          const schemaEncoder = new SchemaEncoder(schema);
          expect(schemaEncoder.schema).to.deep.equal(decodedSchema);
        });
      });
    }

    for (const schema of [
      'boo like',
      'adss contractAddress,bool trusted',
      'bytes32 eventId,uint8 ticketType,uint10000 ticketNum',
      'bytes32 eventId,uint8 ticketType,ticketNum'
    ]) {
      context(schema, () => {
        it('should throw', async () => {
          expect(() => new SchemaEncoder(schema)).to.throw(Error);
        });
      });
    }
  });

  describe('encoding/decoding', () => {
    for (const { schema, types, values } of [
      {
        schema: 'bool like',
        types: ['bool'],
        values: [[true], [false]]
      },
      {
        schema: 'address contractAddress,bool trusted',
        types: ['address', 'bool'],
        values: [
          ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', true],
          ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', false]
        ]
      },
      {
        schema: 'bytes32 eventId,uint8 ticketType,uint32 ticketNum',
        types: ['bytes32', 'uint8', 'uint32'],
        values: [
          ['0x2bbd66db77a761a69195c2ee81b158a0e15e02d47d4528098ae059e0937b9cf2', 8, 100_000],
          ['0xcacdee2a5c6a7e013524774dd74ed464ac260e97e6c8d6b5da2ba8d6eb775946', 0, 0],
          ['0x98f9b0ef313ddecf10200c3943bdd8f2347e151f9ae814a286bde35e323b564d', 255, 1_000_000]
        ]
      },
      {
        schema: 'uint256 id,ipfsHash hash',
        types: ['uint256', 'bytes32'],
        values: [
          [123, '0x55f51668121cf19209d29b2a5a36c34f38c66d65e42135e67e914b6aed448bf7'],
          [0, '0x778d1b0841d47524bf882bbe8e23993f1cf41ccfaea0769fe5215e7008b10655'],
          [1_000_000, '0x822c3d2fc4181bc4eddd792c1b7c18790f8d0b4d207eb0f1d2a2474d0b9baefa']
        ]
      }
    ]) {
      for (const params of values) {
        context(schema, () => {
          context(`params ${params}`, () => {
            let schemaEncoder: SchemaEncoder;

            beforeEach(async () => {
              schemaEncoder = new SchemaEncoder(schema);
            });

            it('should properly encode and decode data', async () => {
              const encoded = schemaEncoder.encodeData(params);
              expect(encoded).to.equal(defaultAbiCoder.encode(types, params));
              expect(schemaEncoder.isEncodedDataValid(encoded)).to.be.true;

              const decoded = schemaEncoder.decodeData(encoded);
              for (const [i, param] of decoded.entries()) {
                expect(param).to.equal(params[i]);
              }
            });
          });
        });
      }
    }
  });

  describe('ipfs', () => {
    describe('CID verification', () => {
      for (const cid of [
        'QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR',
        'QmcRD4wkPPi6dig81r5sLj9Zm1gDCL4zgpEj9CfuRrGbzF'
      ]) {
        context(cid, () => {
          it('should be valid', async () => {
            expect(SchemaEncoder.isCID(cid)).to.be.true;
          });
        });
      }

      for (const cid of [
        'AmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR',
        'QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsM',
        'QaaRD4wkPPi6dig81r5sLj9Zm1gDCL4zgpEj9CfuRrGbzF'
      ]) {
        context(cid, () => {
          it('should be invalid', async () => {
            expect(SchemaEncoder.isCID(cid)).to.be.false;
          });
        });
      }
    });
  });
});
