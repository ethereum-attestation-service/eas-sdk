import { AbiCoder } from 'ethers';
import { SchemaEncoder } from '../../src/schema-encoder';
import { ZERO_ADDRESS } from '../utils/Constants';
import chai from './helpers/chai';

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
            signature: 'bool like',
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
            signature: 'address contractAddress',
            value: ZERO_ADDRESS
          },
          {
            name: 'trusted',
            type: 'bool',
            signature: 'bool trusted',
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
            signature: 'bytes32 eventId',
            value: ''
          },
          {
            name: 'ticketType',
            type: 'uint8',
            signature: 'uint8 ticketType',
            value: '0'
          },
          {
            name: 'ticketNum',
            type: 'uint32',
            signature: 'uint32 ticketNum',
            value: '0'
          }
        ]
      },
      {
        schema: 'bytes32,uint8,uint32',
        decodedSchema: [
          {
            name: '',
            type: 'bytes32',
            signature: 'bytes32',
            value: ''
          },
          {
            name: '',
            type: 'uint8',
            signature: 'uint8',
            value: '0'
          },
          {
            name: '',
            type: 'uint32',
            signature: 'uint32',
            value: '0'
          }
        ]
      },
      {
        schema: 'uint8 voteIndex,(string key,uint8 value)[] map',
        decodedSchema: [
          {
            name: 'voteIndex',
            type: 'uint8',
            signature: 'uint8 voteIndex',
            value: '0'
          },
          {
            name: 'map',
            type: '(string,uint8)[]',
            signature: '(string key,uint8 value)[] map',
            value: []
          }
        ]
      },
      {
        schema: 'uint8  voteIndex,        (string key,   uint8 value)[]      map',
        decodedSchema: [
          {
            name: 'voteIndex',
            type: 'uint8',
            signature: 'uint8 voteIndex',
            value: '0'
          },
          {
            name: 'map',
            type: '(string,uint8)[]',
            signature: '(string key,uint8 value)[] map',
            value: []
          }
        ]
      },
      {
        schema:
          // eslint-disable-next-line max-len
          'string contractGroupName,string ipfsHash,string readmeIpfsHash,address[] contractAddresses,string[] contractNames,string[] contractNetworks,string[] contractIpfsHashes',
        decodedSchema: [
          {
            name: 'contractGroupName',
            type: 'string',
            signature: 'string contractGroupName',
            value: ''
          },
          {
            name: 'ipfsHash',
            type: 'string',
            signature: 'string ipfsHash',
            value: ''
          },
          {
            name: 'readmeIpfsHash',
            type: 'string',
            signature: 'string readmeIpfsHash',
            value: ''
          },
          {
            name: 'contractAddresses',
            type: 'address[]',
            signature: 'address[] contractAddresses',
            value: []
          },
          {
            name: 'contractNames',
            type: 'string[]',
            signature: 'string[] contractNames',
            value: []
          },
          {
            name: 'contractNetworks',
            type: 'string[]',
            signature: 'string[] contractNetworks',
            value: []
          },
          {
            name: 'contractIpfsHashes',
            type: 'string[]',
            signature: 'string[] contractIpfsHashes',
            value: []
          }
        ]
      }
    ]) {
      context(schema, () => {
        it('should properly construct a schema encoder', () => {
          const schemaEncoder = new SchemaEncoder(schema);
          expect(schemaEncoder.schema).to.deep.equal(decodedSchema);
        });

        it('should verify', () => {
          expect(SchemaEncoder.isSchemaValid(schema)).to.be.true;
        });
      });
    }
  });

  describe('encoding/decoding', () => {
    for (const { schema, types, inputs } of [
      {
        schema: 'bool like',
        types: ['bool'],
        inputs: [
          {
            in: [{ type: 'bool', name: 'like', value: true }]
          },
          {
            in: [{ type: 'bool', name: 'like', value: false }]
          }
        ]
      },
      {
        schema: 'address contractAddress,bool trusted',
        types: ['address', 'bool'],
        inputs: [
          {
            in: [
              { type: 'address', name: 'contractAddress', value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
              { type: 'bool', name: 'trusted', value: true }
            ]
          },
          {
            in: [
              { type: 'address', name: 'contractAddress', value: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
              { type: 'bool', name: 'trusted', value: false }
            ]
          }
        ]
      },
      {
        schema: 'address[] contractAddresses, string[] names',
        types: ['address[]', 'string[]'],
        inputs: [
          {
            in: [
              {
                type: 'address[]',
                name: 'contractAddresses',
                value: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8']
              },
              { type: 'string[]', name: 'names', value: ['abc', 'def'] }
            ]
          }
        ]
      },
      {
        schema: 'bytes32 eventId,uint8 ticketType,uint32 ticketNum',
        types: ['bytes32', 'uint8', 'uint32'],
        inputs: [
          {
            in: [
              {
                type: 'bytes32',
                name: 'eventId',
                value: '0x2bbd66db77a761a69195c2ee81b158a0e15e02d47d4528098ae059e0937b9cf2'
              },
              { type: 'uint8', name: 'ticketType', value: 8 },
              { type: 'uint32', name: 'ticketNum', value: 100_000 }
            ]
          },
          {
            in: [
              {
                type: 'bytes32',
                name: 'eventId',
                value: '0xcacdee2a5c6a7e013524774dd74ed464ac260e97e6c8d6b5da2ba8d6eb775946'
              },
              { type: 'uint8', name: 'ticketType', value: 0 },
              { type: 'uint32', name: 'ticketNum', value: 0 }
            ]
          },
          {
            in: [
              {
                type: 'bytes32',
                name: 'eventId',
                value: '0x98f9b0ef313ddecf10200c3943bdd8f2347e151f9ae814a286bde35e323b564d'
              },
              { type: 'uint8', name: 'ticketType', value: 255 },
              { type: 'uint32', name: 'ticketNum', value: 1_000_000 }
            ]
          }
        ]
      },
      {
        schema: 'uint256 id,ipfsHash hash',
        types: ['uint256', 'bytes32'],
        inputs: [
          {
            in: [
              { type: 'uint256', name: 'id', value: 123n },
              {
                type: 'ipfsHash',
                name: 'hash',
                value: '0x55f51668121cf19209d29b2a5a36c34f38c66d65e42135e67e914b6aed448bf7'
              }
            ],
            out: [
              { type: 'uint256', name: 'id', value: 123n },
              {
                type: 'bytes32',
                name: 'hash',
                value: '0x55f51668121cf19209d29b2a5a36c34f38c66d65e42135e67e914b6aed448bf7'
              }
            ]
          },
          {
            in: [
              { type: 'uint256', name: 'id', value: 0n },
              {
                type: 'ipfsHash',
                name: 'hash',
                value: '0x778d1b0841d47524bf882bbe8e23993f1cf41ccfaea0769fe5215e7008b10655'
              }
            ],
            out: [
              { type: 'uint256', name: 'id', value: 0n },
              {
                type: 'bytes32',
                name: 'hash',
                value: '0x778d1b0841d47524bf882bbe8e23993f1cf41ccfaea0769fe5215e7008b10655'
              }
            ]
          },
          {
            in: [
              { type: 'uint256', name: 'id', value: 1_000_000n },
              {
                type: 'ipfsHash',
                name: 'hash',
                value: '0x822c3d2fc4181bc4eddd792c1b7c18790f8d0b4d207eb0f1d2a2474d0b9baefa'
              }
            ],
            out: [
              { type: 'uint256', name: 'id', value: 1_000_000n },
              {
                type: 'bytes32',
                name: 'hash',
                value: '0x822c3d2fc4181bc4eddd792c1b7c18790f8d0b4d207eb0f1d2a2474d0b9baefa'
              }
            ]
          }
        ]
      },
      {
        schema: 'uint8 voteIndex,(string key,uint8 value)[] map',
        types: ['uint8', '(string key,uint8 value)[]'],
        inputs: [
          {
            in: [
              { type: 'uint8', name: 'voteIndex', value: '123' },
              {
                type: '(string,uint8)[]',
                name: 'map',
                value: [{ key: 'voter1', value: 1n }]
              }
            ],
            out: [
              { type: 'uint8', name: 'voteIndex', value: '123' },
              {
                type: '(string,uint8)[]',
                name: 'map',
                value: [
                  [
                    { name: 'key', type: 'string', value: 'voter1' },
                    { name: 'value', type: 'uint8', value: 1n }
                  ]
                ]
              }
            ]
          },
          {
            in: [
              { type: 'uint8', name: 'voteIndex', value: 100 },
              {
                type: '(string,uint8)[]',
                name: 'map',
                value: [
                  { key: 'voter1', value: 1n },
                  { key: 'voter2', value: 2n },
                  { key: 'voter3', value: 3n }
                ]
              }
            ],
            out: [
              { type: 'uint8', name: 'voteIndex', value: 100 },
              {
                type: '(string,uint8)[]',
                name: 'map',
                value: [
                  [
                    { name: 'key', type: 'string', value: 'voter1' },
                    { name: 'value', type: 'uint8', value: 1n }
                  ],
                  [
                    { name: 'key', type: 'string', value: 'voter2' },
                    { name: 'value', type: 'uint8', value: 2n }
                  ],
                  [
                    { name: 'key', type: 'string', value: 'voter3' },
                    { name: 'value', type: 'uint8', value: 3n }
                  ]
                ]
              }
            ]
          },
          {
            in: [
              { type: 'uint8', name: 'voteIndex', value: 7 },
              {
                type: '(string,uint8)[]',
                name: 'map',
                value: [
                  ['voter1', 10n],
                  ['voter2', 20n],
                  ['voter3', 30n]
                ]
              }
            ],
            out: [
              { type: 'uint8', name: 'voteIndex', value: 7 },
              {
                type: '(string,uint8)[]',
                name: 'map',
                value: [
                  [
                    { name: 'key', type: 'string', value: 'voter1' },
                    { name: 'value', type: 'uint8', value: 10n }
                  ],
                  [
                    { name: 'key', type: 'string', value: 'voter2' },
                    { name: 'value', type: 'uint8', value: 20n }
                  ],
                  [
                    { name: 'key', type: 'string', value: 'voter3' },
                    { name: 'value', type: 'uint8', value: 30n }
                  ]
                ]
              }
            ]
          },
          {
            in: [
              { type: 'uint8', name: 'voteIndex', value: 9 },
              {
                type: '(string,uint8)[]',
                name: 'map',
                value: []
              }
            ],
            out: [
              { type: 'uint8', name: 'voteIndex', value: 9 },
              {
                type: '(string,uint8)[]',
                name: 'map',
                value: []
              }
            ]
          },
          {
            in: [
              { type: 'uint8', name: 'voteIndex', value: 222 },
              {
                type: '(string,    uint8)[]',
                name: 'map',
                value: []
              }
            ],
            out: [
              { type: 'uint8', name: 'voteIndex', value: 222 },
              {
                type: '(string,uint8)[]',
                name: 'map',
                value: []
              }
            ]
          }
        ]
      },
      {
        schema: 'string name,(string key,string value) entry',
        types: ['string', '(string key,string value)'],
        inputs: [
          {
            in: [
              { type: 'string', name: 'name', value: 'Entry 1' },
              {
                type: '(string,string)',
                name: 'entry',
                value: { key: 'entry1', value: 'data1' }
              }
            ],
            out: [
              { type: 'string', name: 'name', value: 'Entry 1' },
              {
                type: '(string,string)',
                name: 'entry',
                value: [
                  { name: 'key', type: 'string', value: 'entry1' },
                  { name: 'value', type: 'string', value: 'data1' }
                ]
              }
            ]
          }
        ]
      },
      {
        schema: 'string     name,      (string    key, string value   ) entry',
        types: ['string', '(string   key,  string value)'],
        inputs: [
          {
            in: [
              { type: 'string', name: 'name', value: 'Entry 1' },
              {
                type: '(string,    string)',
                name: 'entry',
                value: { key: 'entry1', value: 'data1' }
              }
            ],
            out: [
              { type: 'string', name: 'name', value: 'Entry 1' },
              {
                type: '(string,string)',
                name: 'entry',
                value: [
                  { name: 'key', type: 'string', value: 'entry1' },
                  { name: 'value', type: 'string', value: 'data1' }
                ]
              }
            ]
          }
        ]
      },
      {
        schema: '(uint256 badgeId,uint256 level)[] badges',
        types: ['(uint256 badgeId,uint256 level)[]'],
        inputs: [
          {
            in: [
              {
                type: '(uint256,uint256)[]',
                name: 'badges',
                value: [
                  { badgeId: 1n, level: 10n },
                  { badgeId: 2n, level: 20n },
                  { badgeId: 3n, level: 30n }
                ]
              }
            ],
            out: [
              {
                type: '(uint256,uint256)[]',
                name: 'badges',
                value: [
                  [
                    { name: 'badgeId', type: 'uint256', value: 1n },
                    { name: 'level', type: 'uint256', value: 10n }
                  ],
                  [
                    { name: 'badgeId', type: 'uint256', value: 2n },
                    { name: 'level', type: 'uint256', value: 20n }
                  ],
                  [
                    { name: 'badgeId', type: 'uint256', value: 3n },
                    { name: 'level', type: 'uint256', value: 30n }
                  ]
                ]
              }
            ]
          }
        ]
      }
    ]) {
      for (const params of inputs) {
        context(schema, () => {
          context(`params ${JSON.stringify(params, (_, v) => (v && v.toString()) || v)}`, () => {
            let schemaEncoder: SchemaEncoder;

            beforeEach(() => {
              schemaEncoder = new SchemaEncoder(schema);
            });

            it('should properly encode and decode data', () => {
              const encoded = schemaEncoder.encodeData(params.in);
              expect(encoded).to.equal(
                AbiCoder.defaultAbiCoder().encode(
                  types,
                  params.in.map((p) => p.value)
                )
              );
              const decoded = schemaEncoder.decodeData(encoded);
              expect(schemaEncoder.isEncodedDataValid(encoded)).to.be.true;

              for (const [i, { name, type, signature, value }] of decoded.entries()) {
                const schema = schemaEncoder.schema[i];
                expect(name).to.equal(schema.name);
                expect(type).to.equal(schema.type);
                expect(signature).to.equal(schema.signature);

                const expectedValue = params.out ? params.out[i] : params.in[i];
                expect(value.name).to.equal(expectedValue.name);
                expect(value.type).to.equal(expectedValue.type);
                expect(value.value).to.deep.equal(expectedValue.value);
              }
            });
          });
        });
      }
    }

    for (const { schema, inputs } of [
      {
        schema: 'bool like',
        inputs: [[{ type: 'uint8', name: 'like', value: true }]]
      },
      {
        schema: 'address contractAddress,bool trusted',
        inputs: [
          [
            { type: 'address', name: 'contractAddress', value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
            { type: 'uint8', name: 'trusted', value: true }
          ],
          [
            { type: 'bytes32', name: 'contractAddress', value: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
            { type: 'bool', name: 'trusted', value: false }
          ]
        ]
      },
      {
        schema: 'uint256 id,ipfsHash hash',
        inputs: [
          [
            { type: 'uint128', name: 'id', value: 123n },
            {
              type: 'ipfsHash',
              name: 'hash',
              value: '0x55f51668121cf19209d29b2a5a36c34f38c66d65e42135e67e914b6aed448bf7'
            }
          ],
          [
            { type: 'uint256', name: 'id', value: 0n },
            {
              type: 'ipfsHash222',
              name: 'hash',
              value: '0x778d1b0841d47524bf882bbe8e23993f1cf41ccfaea0769fe5215e7008b10655'
            }
          ]
        ]
      }
    ]) {
      for (const params of inputs) {
        context(schema, () => {
          context(`params ${JSON.stringify(params, (_, v) => (v && v.toString()) || v)}`, () => {
            let schemaEncoder: SchemaEncoder;

            beforeEach(() => {
              schemaEncoder = new SchemaEncoder(schema);
            });

            it('should throw on an invalid type', () => {
              expect(() => schemaEncoder.encodeData(params)).to.throw('Incompatible param type');
            });
          });
        });
      }
    }

    for (const { schema, inputs } of [
      {
        schema: 'bool like',
        inputs: [[{ type: 'bool', name: 'counter', value: true }]]
      },
      {
        schema: 'address contractAddress,bool trusted',
        inputs: [
          [
            { type: 'address', name: 'address', value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
            { type: 'bool', name: 'trusted', value: true }
          ],
          [
            { type: 'address', name: 'contractAddress', value: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
            { type: 'bool', name: 'liked', value: false }
          ]
        ]
      },
      {
        schema: 'bytes32 eventId,uint8 ticketType,uint32 ticketNum',
        inputs: [
          [
            {
              type: 'bytes32',
              name: 'id',
              value: '0x2bbd66db77a761a69195c2ee81b158a0e15e02d47d4528098ae059e0937b9cf2'
            },
            { type: 'uint8', name: 'ticketType', value: 8 },
            { type: 'uint32', name: 'ticketNum', value: 100_000 }
          ],
          [
            {
              type: 'bytes32',
              name: 'eventId',
              value: '0xcacdee2a5c6a7e013524774dd74ed464ac260e97e6c8d6b5da2ba8d6eb775946'
            },
            { type: 'uint8', name: 'type', value: 0 },
            { type: 'uint32', name: 'ticketNum', value: 0 }
          ],
          [
            {
              type: 'bytes32',
              name: 'eventId',
              value: '0x98f9b0ef313ddecf10200c3943bdd8f2347e151f9ae814a286bde35e323b564d'
            },
            { type: 'uint8', name: 'ticketType', value: 255 },
            { type: 'uint32', name: 'num', value: 1_000_000 }
          ]
        ]
      }
    ]) {
      for (const params of inputs) {
        context(schema, () => {
          context(`params ${JSON.stringify(params, (_, v) => (v && v.toString()) || v)}`, () => {
            let schemaEncoder: SchemaEncoder;

            beforeEach(() => {
              schemaEncoder = new SchemaEncoder(schema);
            });

            it('should throw on an invalid name', () => {
              expect(() => schemaEncoder.encodeData(params)).to.throw('Incompatible param name');
            });
          });
        });
      }
    }
  });

  describe('verification', () => {
    for (const schema of [
      'boo like',
      'adss contractAddress,bool trusted',
      'bytes32 eventId,uint8 ticketType,uint10000 ticketNum',
      'bytes32 eventId,uint8 ticketType,ticketNum'
    ]) {
      context(schema, () => {
        it('should unable to verify', () => {
          expect(SchemaEncoder.isSchemaValid(schema)).to.be.false;
        });
      });
    }
  });

  describe('ipfs', () => {
    describe('CID verification', () => {
      for (const cid of [
        'QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR',
        'QmcRD4wkPPi6dig81r5sLj9Zm1gDCL4zgpEj9CfuRrGbzF'
      ]) {
        context(cid, () => {
          it('should be valid', () => {
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
          it('should be invalid', () => {
            expect(SchemaEncoder.isCID(cid)).to.be.false;
          });
        });
      }
    });
  });
});
