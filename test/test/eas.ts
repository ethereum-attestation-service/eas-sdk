import {
  EAS as EASContract,
  EIP712Proxy as EIP712ProxyContract,
  SchemaRegistry as SchemaRegistryContract
} from '@ethereum-attestation-service/eas-contracts';
import { encodeBytes32String, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { EAS, NO_EXPIRATION } from '../../src/eas';
import { EIP712Proxy } from '../../src/eip712-proxy';
import { Delegated, DelegatedProxy, Offchain } from '../../src/offchain';
import { SchemaRegistry } from '../../src/schema-registry';
import { getSchemaUID, getUIDFromAttestTx } from '../../src/utils';
import Contracts from '../components/Contracts';
import { ZERO_ADDRESS, ZERO_BYTES, ZERO_BYTES32 } from '../utils/Constants';
import chai from './helpers/chai';
import { CustomOffchain } from './helpers/custom-offchain';
import {
  expectAttestation,
  expectMultiAttestations,
  expectMultiRevocations,
  expectRevocation,
  SignatureType
} from './helpers/eas';
import { duration, latest } from './helpers/time';
import { createWallet } from './helpers/wallet';

const { expect } = chai;

const EIP712_PROXY_NAME = 'EAS-Proxy';

describe('EAS API', () => {
  let accounts: Signer[];
  let sender: Signer;
  let recipient: Signer;
  let recipient2: Signer;

  let registry: SchemaRegistryContract;
  let easContract: EASContract;
  let proxyContract: EIP712ProxyContract;

  let eas: EAS;
  let schemaRegistry: SchemaRegistry;
  let proxy: EIP712Proxy;

  before(async () => {
    accounts = await ethers.getSigners();

    [recipient, recipient2] = accounts;
  });

  beforeEach(async () => {
    sender = await createWallet();

    registry = await Contracts.SchemaRegistry.deploy();
    easContract = await Contracts.EAS.deploy(await registry.getAddress());
    proxyContract = await Contracts.EIP712Proxy.deploy(await easContract.getAddress(), EIP712_PROXY_NAME);
  });

  context('with a provider', () => {
    beforeEach(async () => {
      eas = new EAS(await easContract.getAddress(), { signerOrProvider: ethers.provider });

      schemaRegistry = new SchemaRegistry(await registry.getAddress(), { signerOrProvider: ethers.provider });
    });

    describe('construction', () => {
      it('should properly create an EAS API', async () => {
        expect(eas.contract.runner?.provider).not.to.be.null;

        expect(await eas.getVersion()).to.equal(await easContract.version());
      });
    });

    context('with a registered schema', () => {
      const schema = 'bool like';
      const schemaId = getSchemaUID(schema, ZERO_ADDRESS, true);

      beforeEach(async () => {
        await registry.register(schema, ZERO_ADDRESS, true);
      });

      it('should be able to query the schema registry', async () => {
        expect((await schemaRegistry.getSchema({ uid: schemaId })).uid).to.equal(schemaId);
      });

      it('should not be able to make new attestations', async () => {
        await expect(
          eas.attest({
            schema: schemaId,
            data: {
              recipient: await recipient.getAddress(),
              expirationTime: NO_EXPIRATION,
              revocable: true,
              refUID: ZERO_BYTES32,
              data: ZERO_BYTES
            }
          })
        ).to.be.rejectedWith('contract runner does not support sending transactions');
      });

      it('should not be able to register a new schema', async () => {
        await expect(schemaRegistry.register({ schema, resolverAddress: ZERO_ADDRESS })).to.be.rejectedWith(
          'contract runner does not support sending transactions'
        );
      });

      context('with an attestation', () => {
        let uid: string;

        beforeEach(async () => {
          const res = await easContract.attest({
            schema: schemaId,
            data: {
              recipient: await recipient.getAddress(),
              expirationTime: NO_EXPIRATION,
              revocable: true,
              refUID: ZERO_BYTES32,
              data: ZERO_BYTES,
              value: 0
            }
          });

          uid = await getUIDFromAttestTx(res);
        });

        it('should be able to query the EAS', async () => {
          expect((await eas.getAttestation(uid)).uid).to.equal(uid);
        });
      });
    });
  });

  context('with a signer', () => {
    beforeEach(async () => {
      proxy = new EIP712Proxy(await proxyContract.getAddress(), { signerOrProvider: sender });
      eas = new EAS(await easContract.getAddress(), { signerOrProvider: sender, proxy });
      schemaRegistry = new SchemaRegistry(await registry.getAddress(), { signerOrProvider: sender });
    });

    describe('attesting', () => {
      let expirationTime: bigint;
      const data = '0x1234';

      beforeEach(async () => {
        expirationTime = (await latest()) + duration.days(30n);
      });

      for (const signatureType of [
        SignatureType.Direct,
        SignatureType.Delegated,
        SignatureType.DelegatedProxy,
        SignatureType.Offchain
      ]) {
        context(`via ${signatureType} attestation`, () => {
          for (const revocable of [true, false]) {
            for (const [maxPriorityFeePerGas, maxFeePerGas] of [
              [undefined, undefined],
              [1000000000n, 200000000000n]
            ]) {
              context(
                maxPriorityFeePerGas && maxFeePerGas
                  ? `with maxPriorityFeePerGas=${maxPriorityFeePerGas.toString()}, maxFeePerGas=${maxFeePerGas.toString()} overrides`
                  : 'with default fees',
                () => {
                  context(`with ${revocable ? 'a revocable' : 'an irrevocable'} registered schema`, () => {
                    const schema1 = 'bool like';
                    const schema2 = 'bytes32 proposalId, bool vote';
                    let schema1Id: string;
                    let schema2Id: string;

                    beforeEach(async () => {
                      const tx1 = await schemaRegistry.register({ schema: schema1, revocable });
                      const tx2 = await schemaRegistry.register({ schema: schema2, revocable });

                      schema1Id = await tx1.wait();
                      schema2Id = await tx2.wait();
                    });

                    it('should be able to query the schema registry', async () => {
                      const schemaData = await registry.getSchema(schema1Id);
                      expect(schemaData.uid).to.equal(schema1Id);
                      expect(schemaData.resolver).to.equal(ZERO_ADDRESS);
                      expect(schemaData.revocable).to.equal(revocable);
                      expect(schemaData.schema).to.equal(schema1);
                    });

                    it('should allow attestation to an empty recipient', async () => {
                      await expectAttestation(
                        eas,
                        schema1Id,
                        {
                          recipient: ZERO_ADDRESS,
                          expirationTime,
                          revocable,
                          data
                        },
                        {
                          signatureType,
                          from: sender,
                          maxFeePerGas,
                          maxPriorityFeePerGas,
                          deadline: (await latest()) + duration.days(1n)
                        }
                      );
                    });

                    it('should allow self attestations', async () => {
                      await expectAttestation(
                        eas,
                        schema1Id,
                        { recipient: await sender.getAddress(), expirationTime, revocable, data },
                        {
                          signatureType,
                          from: sender,
                          maxFeePerGas,
                          maxPriorityFeePerGas,
                          deadline: (await latest()) + duration.days(1n)
                        }
                      );
                    });

                    it('should allow multiple attestations', async () => {
                      await expectAttestation(
                        eas,
                        schema1Id,
                        {
                          recipient: await recipient.getAddress(),
                          expirationTime,
                          revocable,
                          data: encodeBytes32String('0')
                        },
                        {
                          signatureType,
                          from: sender,
                          maxFeePerGas,
                          maxPriorityFeePerGas,
                          deadline: (await latest()) + duration.days(1n)
                        }
                      );

                      await expectAttestation(
                        eas,
                        schema1Id,
                        {
                          recipient: await recipient2.getAddress(),
                          expirationTime,
                          revocable,
                          data: encodeBytes32String('1')
                        },
                        {
                          signatureType,
                          from: sender,
                          maxFeePerGas,
                          maxPriorityFeePerGas,
                          deadline: (await latest()) + duration.days(1n)
                        }
                      );
                    });

                    if (signatureType !== SignatureType.Offchain) {
                      it('should allow multi attestations', async () => {
                        await expectMultiAttestations(
                          eas,
                          [
                            {
                              schema: schema1Id,
                              data: [
                                {
                                  recipient: await recipient.getAddress(),
                                  expirationTime,
                                  revocable,
                                  data: encodeBytes32String('0')
                                },
                                {
                                  recipient: await recipient2.getAddress(),
                                  expirationTime,
                                  revocable,
                                  data: encodeBytes32String('1')
                                }
                              ]
                            },
                            {
                              schema: schema2Id,
                              data: [
                                {
                                  recipient: await recipient.getAddress(),
                                  expirationTime,
                                  revocable,
                                  data: encodeBytes32String('2')
                                },
                                {
                                  recipient: await recipient2.getAddress(),
                                  expirationTime,
                                  revocable,
                                  data: encodeBytes32String('3')
                                }
                              ]
                            }
                          ],
                          {
                            signatureType,
                            from: sender,
                            maxFeePerGas,
                            maxPriorityFeePerGas,
                            deadline: (await latest()) + duration.days(1n)
                          }
                        );
                      });
                    }

                    it('should allow attestation without expiration time', async () => {
                      await expectAttestation(
                        eas,
                        schema1Id,
                        { recipient: await recipient.getAddress(), expirationTime: NO_EXPIRATION, revocable, data },
                        {
                          signatureType,
                          from: sender,
                          maxFeePerGas,
                          maxPriorityFeePerGas,
                          deadline: (await latest()) + duration.days(1n)
                        }
                      );
                    });

                    it('should allow attestation without any data', async () => {
                      await expectAttestation(
                        eas,
                        schema1Id,
                        { recipient: await recipient.getAddress(), expirationTime, revocable, data: ZERO_BYTES },
                        {
                          signatureType,
                          from: sender,
                          maxFeePerGas,
                          maxPriorityFeePerGas,
                          deadline: (await latest()) + duration.days(1n)
                        }
                      );
                    });

                    it('should store referenced attestation', async () => {
                      const uid = await (
                        await eas.attest({
                          schema: schema1Id,
                          data: { recipient: await recipient.getAddress(), expirationTime, revocable, data }
                        })
                      ).wait();

                      await expectAttestation(
                        eas,
                        schema1Id,
                        { recipient: await recipient.getAddress(), expirationTime, revocable, refUID: uid, data },
                        {
                          signatureType,
                          from: sender,
                          maxFeePerGas,
                          maxPriorityFeePerGas,
                          deadline: (await latest()) + duration.days(1n)
                        }
                      );
                    });
                  });
                }
              );
            }
          }
        });
      }
    });

    describe('revocation', () => {
      const schema1 = 'bool like';
      const schema2 = 'bytes32 proposalId, bool vote';
      let schema1Id: string;
      let schema2Id: string;

      let uids1: string[];
      let uids2: string[];

      beforeEach(async () => {
        const tx1 = await schemaRegistry.register({ schema: schema1 });
        const tx2 = await schemaRegistry.register({ schema: schema2 });

        schema1Id = await tx1.wait();
        schema2Id = await tx2.wait();
      });

      for (const signatureType of [SignatureType.Direct, SignatureType.Delegated, SignatureType.DelegatedProxy]) {
        for (const [maxPriorityFeePerGas, maxFeePerGas] of [
          [undefined, undefined],
          [1000000000n, 200000000000n]
        ]) {
          context(
            maxPriorityFeePerGas && maxFeePerGas
              ? `with maxPriorityFeePerGas=${maxPriorityFeePerGas.toString()}, maxFeePerGas=${maxFeePerGas.toString()} overrides`
              : 'with default fees',
            () => {
              context(`via ${signatureType} revocation`, () => {
                beforeEach(async () => {
                  uids1 = [];

                  for (let i = 0; i < 2; i++) {
                    const uid = await expectAttestation(
                      eas,
                      schema1Id,
                      {
                        recipient: await recipient.getAddress(),
                        expirationTime: NO_EXPIRATION,
                        data: encodeBytes32String((i + 1).toString())
                      },
                      {
                        signatureType,
                        from: sender,
                        maxFeePerGas,
                        maxPriorityFeePerGas,
                        deadline: (await latest()) + duration.days(1n)
                      }
                    );

                    uids1.push(uid);
                  }

                  uids2 = [];

                  for (let i = 0; i < 2; i++) {
                    const uid = await expectAttestation(
                      eas,
                      schema2Id,
                      {
                        recipient: await recipient.getAddress(),
                        expirationTime: NO_EXPIRATION,
                        data: encodeBytes32String((i + 1).toString())
                      },
                      {
                        signatureType,
                        from: sender,
                        maxFeePerGas,
                        maxPriorityFeePerGas,
                        deadline: (await latest()) + duration.days(1n)
                      }
                    );

                    uids2.push(uid);
                  }
                });

                it('should allow to revoke existing attestations', async () => {
                  for (const uid of uids1) {
                    await expectRevocation(
                      eas,
                      schema1Id,
                      { uid },
                      {
                        signatureType,
                        from: sender,
                        maxFeePerGas,
                        maxPriorityFeePerGas,
                        deadline: (await latest()) + duration.days(1n)
                      }
                    );
                  }

                  for (const uid of uids2) {
                    await expectRevocation(
                      eas,
                      schema2Id,
                      { uid },
                      {
                        signatureType,
                        from: sender,
                        maxFeePerGas,
                        maxPriorityFeePerGas,
                        deadline: (await latest()) + duration.days(1n)
                      }
                    );
                  }
                });

                it('should allow to multi-revoke existing attestations', async () => {
                  await expectMultiRevocations(
                    eas,
                    [
                      {
                        schema: schema1Id,
                        data: [{ uid: uids1[0] }, { uid: uids1[1] }]
                      },
                      {
                        schema: schema2Id,
                        data: [{ uid: uids2[0] }, { uid: uids2[1] }]
                      }
                    ],
                    {
                      signatureType,
                      from: sender,
                      maxFeePerGas,
                      maxPriorityFeePerGas,
                      deadline: (await latest()) + duration.days(1n)
                    }
                  );
                });
              });
            }
          );
        }
      }
    });

    describe('timestamping', () => {
      const data1 = encodeBytes32String('0x1234');
      const data2 = encodeBytes32String('0x4567');
      const data3 = encodeBytes32String('0x6666');

      for (const [maxPriorityFeePerGas, maxFeePerGas] of [
        [undefined, undefined],
        [1000000000, 200000000000]
      ]) {
        context(
          maxPriorityFeePerGas && maxFeePerGas
            ? `with maxPriorityFeePerGas=${maxPriorityFeePerGas.toString()}, maxFeePerGas=${maxFeePerGas.toString()} overrides`
            : 'with default fees',
          () => {
            const overrides = maxPriorityFeePerGas && maxFeePerGas ? { maxFeePerGas, maxPriorityFeePerGas } : undefined;

            it('should timestamp a single data', async () => {
              const tx = await eas.timestamp(data1, overrides);
              const timestamp = await tx.wait();
              expect(timestamp).to.equal(await latest());

              expect(await eas.getTimestamp(data1)).to.equal(timestamp);

              if (maxPriorityFeePerGas && maxFeePerGas) {
                expect(tx.tx.maxPriorityFeePerGas).to.equal(maxPriorityFeePerGas);
                expect(tx.tx.maxFeePerGas).to.equal(maxFeePerGas);
              }

              const tx2 = await eas.timestamp(data2, overrides);
              const timestamp2 = await tx2.wait();
              expect(timestamp2).to.equal(await latest());

              expect(await eas.getTimestamp(data2)).to.equal(timestamp2);

              if (maxPriorityFeePerGas && maxFeePerGas) {
                expect(tx2.tx.maxPriorityFeePerGas).to.equal(maxPriorityFeePerGas);
                expect(tx2.tx.maxFeePerGas).to.equal(maxFeePerGas);
              }
            });

            it('should timestamp multiple data', async () => {
              const data = [data1, data2];
              const tx = await eas.multiTimestamp([data1, data2], overrides);
              const timestamps = await tx.wait();

              const currentTime = await latest();

              for (const [i, d] of data.entries()) {
                const timestamp = timestamps[i];
                expect(timestamp).to.equal(currentTime);

                expect(await eas.getTimestamp(d)).to.equal(timestamp);
              }

              if (maxPriorityFeePerGas && maxFeePerGas) {
                expect(tx.tx.maxPriorityFeePerGas).to.equal(maxPriorityFeePerGas);
                expect(tx.tx.maxFeePerGas).to.equal(maxFeePerGas);
              }
            });

            it("should return 0 for any data that wasn't timestamped multiple data", async () => {
              expect(await eas.getTimestamp(data3)).to.equal(0);
            });
          }
        );
      }
    });

    describe('offchain attestation handling/verification', () => {
      let offchain: Offchain;

      const schema = 'bool like';
      const schemaId = getSchemaUID(schema, ZERO_ADDRESS, true);

      beforeEach(async () => {
        await registry.register(schema, ZERO_ADDRESS, false);
      });

      beforeEach(async () => {
        offchain = await eas.getOffchain();
      });

      describe('versioning', () => {
        it('should support version 0', async () => {
          const response = await offchain.signOffchainAttestation(
            {
              version: 0,
              schema: schemaId,
              recipient: await recipient.getAddress(),
              time: await latest(),
              expirationTime: NO_EXPIRATION,
              revocable: false,
              refUID: ZERO_BYTES32,
              data: ZERO_BYTES
            },
            sender
          );
          expect(await offchain.verifyOffchainAttestationSignature(await sender.getAddress(), response)).to.be.true;
        });

        it('should support version 1', async () => {
          const response = await offchain.signOffchainAttestation(
            {
              version: 1,
              schema: schemaId,
              recipient: await recipient.getAddress(),
              time: await latest(),
              expirationTime: NO_EXPIRATION,
              revocable: false,
              refUID: ZERO_BYTES32,
              data: ZERO_BYTES
            },
            sender
          );
          expect(await offchain.verifyOffchainAttestationSignature(await sender.getAddress(), response)).to.be.true;
        });
      });

      describe('verification', () => {
        beforeEach(async () => {
          await registry.register(schema, ZERO_ADDRESS, true);
        });

        it('should verify the attestation onchain', async () => {
          const response = await offchain.signOffchainAttestation(
            {
              version: 1,
              schema: schemaId,
              recipient: await recipient.getAddress(),
              time: await latest(),
              expirationTime: NO_EXPIRATION,
              revocable: false,
              refUID: ZERO_BYTES32,
              data: ZERO_BYTES
            },
            sender,
            { verifyOnchain: true }
          );
          expect(await offchain.verifyOffchainAttestationSignature(await sender.getAddress(), response)).to.be.true;
        });

        it('should throw on onchain verification of invalid attestations', async () => {
          const params = {
            version: 1,
            schema: schemaId,
            recipient: await recipient.getAddress(),
            time: await latest(),
            expirationTime: NO_EXPIRATION,
            revocable: false,
            refUID: ZERO_BYTES32,
            data: ZERO_BYTES
          };

          // Invalid schema
          await expect(
            offchain.signOffchainAttestation({ ...params, schema: ZERO_BYTES32 }, sender, { verifyOnchain: true })
          ).to.be.rejectedWith(
            "Error: VM Exception while processing transaction: reverted with custom error 'InvalidSchema()'"
          );

          // Invalid expiration time
          await expect(
            offchain.signOffchainAttestation(
              { ...params, expirationTime: (await latest()) - duration.days(1n) },
              sender,
              { verifyOnchain: true }
            )
          ).to.be.rejectedWith(
            "Error: VM Exception while processing transaction: reverted with custom error 'InvalidExpirationTime()"
          );
        });

        it('should throw on offchain verification of invalid attestations', async () => {
          const params = {
            version: 1,
            schema: schemaId,
            recipient: await recipient.getAddress(),
            time: await latest(),
            expirationTime: NO_EXPIRATION,
            revocable: false,
            refUID: ZERO_BYTES32,
            data: ZERO_BYTES
          };
          const senderAddress = await sender.getAddress();

          const response = await offchain.signOffchainAttestation(params, sender);

          // Invalid attester
          expect(() => offchain.verifyOffchainAttestationSignature(ZERO_ADDRESS, response)).to.throw('Invalid address');

          // Invalid domains
          const { domain } = response;

          await expect(() =>
            offchain.verifyOffchainAttestationSignature(senderAddress, {
              ...response,
              ...{ domain: { ...domain, chainId: domain.chainId + 100n } }
            })
          ).to.throw('Invalid domain');

          await expect(() =>
            offchain.verifyOffchainAttestationSignature(senderAddress, {
              ...response,
              ...{ domain: { ...domain, verifyingContract: ZERO_ADDRESS } }
            })
          ).to.throw('Invalid domain');

          // Invalid domain verification won't throw, due to the check not being strict, but will fail on signature
          await expect(
            offchain.verifyOffchainAttestationSignature(senderAddress, {
              ...response,
              ...{ domain: { ...domain, name: `BAD${domain.name}BAD` } }
            })
          ).to.be.false;

          // Invalid version verification won't throw, due to the check not being strict, but will fail on signature
          await expect(
            offchain.verifyOffchainAttestationSignature(senderAddress, {
              ...response,
              ...{ domain: { ...domain, version: '9999.9999.9999' } }
            })
          ).to.be.false;

          // Invalid primary type
          await expect(() =>
            offchain.verifyOffchainAttestationSignature(senderAddress, {
              ...response,
              ...{ primaryType: `BAD${response.primaryType}BAD` }
            })
          ).to.throw('Invalid primary type');

          // Invalid types
          await expect(() =>
            offchain.verifyOffchainAttestationSignature(senderAddress, {
              ...response,
              ...{
                types: { [response.primaryType]: [{ name: 'schema', type: 'bytes32' }] }
              }
            })
          ).to.throw('Invalid types');

          await expect(() =>
            offchain.verifyOffchainAttestationSignature(senderAddress, {
              ...response,
              ...{
                types: { BAD: response.types.values }
              }
            })
          ).to.throw('Invalid types');
        });

        it('should verify offchain attestations with legacy/obsoleted domains', async () => {
          const { config } = offchain;
          const customOffchain = new CustomOffchain(config, { name: 'XXX', version: '0.0.1' }, new EAS(ZERO_ADDRESS));

          const params = {
            version: 1,
            schema: schemaId,
            recipient: await recipient.getAddress(),
            time: await latest(),
            expirationTime: NO_EXPIRATION,
            revocable: false,
            refUID: ZERO_BYTES32,
            data: ZERO_BYTES
          };
          const senderAddress = await sender.getAddress();
          const response = await customOffchain.signOffchainAttestation(params, sender);

          await expect(offchain.verifyOffchainAttestationSignature(senderAddress, response)).to.be.true;
        });

        context('with an irrevocable schema', () => {
          const schema2 = 'bytes32 eventId,uint8 ticketType,uint32 ticketNum';
          const schema2Id = getSchemaUID(schema2, ZERO_ADDRESS, false);

          beforeEach(async () => {
            await registry.register(schema2, ZERO_ADDRESS, false);
          });

          it('should throw on verification of invalid offchain attestations', async () => {
            await expect(
              offchain.signOffchainAttestation(
                {
                  version: 1,
                  schema: schema2Id,
                  recipient: await recipient.getAddress(),
                  time: await latest(),
                  expirationTime: NO_EXPIRATION,
                  revocable: true,
                  refUID: ZERO_BYTES32,
                  data: ZERO_BYTES
                },
                sender,
                { verifyOnchain: true }
              )
            ).to.be.rejectedWith(
              "Error: VM Exception while processing transaction: reverted with custom error 'Irrevocable()'"
            );
          });
        });
      });

      describe('revocation', () => {
        const data1 = encodeBytes32String('0x1234');
        const data2 = encodeBytes32String('0x4567');
        const data3 = encodeBytes32String('0x6666');

        for (const [maxPriorityFeePerGas, maxFeePerGas] of [
          [undefined, undefined],
          [1000000000, 200000000000]
        ]) {
          context(
            maxPriorityFeePerGas && maxFeePerGas
              ? `with maxPriorityFeePerGas=${maxPriorityFeePerGas.toString()}, maxFeePerGas=${maxFeePerGas.toString()} overrides`
              : 'with default fees',
            () => {
              const overrides =
                maxPriorityFeePerGas && maxFeePerGas ? { maxFeePerGas, maxPriorityFeePerGas } : undefined;

              it('should revoke a single data', async () => {
                const tx = await eas.revokeOffchain(data1, overrides);
                const timestamp = await tx.wait();
                expect(timestamp).to.equal(await latest());

                expect(await eas.getRevocationOffchain(await sender.getAddress(), data1)).to.equal(timestamp);

                if (maxPriorityFeePerGas && maxFeePerGas) {
                  expect(tx.tx.maxPriorityFeePerGas).to.equal(maxPriorityFeePerGas);
                  expect(tx.tx.maxFeePerGas).to.equal(maxFeePerGas);
                }

                const tx2 = await eas.revokeOffchain(data2, overrides);
                const timestamp2 = await tx2.wait();
                expect(timestamp2).to.equal(await latest());

                expect(await eas.getRevocationOffchain(await sender.getAddress(), data2)).to.equal(timestamp2);

                if (maxPriorityFeePerGas && maxFeePerGas) {
                  expect(tx2.tx.maxPriorityFeePerGas).to.equal(maxPriorityFeePerGas);
                  expect(tx2.tx.maxFeePerGas).to.equal(maxFeePerGas);
                }
              });

              it('should revoke multiple data', async () => {
                const data = [data1, data2];
                const tx = await eas.multiRevokeOffchain([data1, data2], overrides);
                const timestamps = await tx.wait();

                const currentTime = await latest();

                for (const [i, d] of data.entries()) {
                  const timestamp = timestamps[i];
                  expect(timestamp).to.equal(currentTime);

                  expect(await eas.getRevocationOffchain(await sender.getAddress(), d)).to.equal(timestamp);
                }

                if (maxPriorityFeePerGas && maxFeePerGas) {
                  expect(tx.tx.maxPriorityFeePerGas).to.equal(maxPriorityFeePerGas);
                  expect(tx.tx.maxFeePerGas).to.equal(maxFeePerGas);
                }
              });
            }
          );
        }

        it("should return 0 for any data that wasn't revoked multiple data", async () => {
          expect(await eas.getRevocationOffchain(await sender.getAddress(), data3)).to.equal(0);
        });
      });
    });

    describe('delegated attestation handling/verification', () => {
      let delegated: Delegated;

      const schema = 'bool like';
      const schemaId = getSchemaUID(schema, ZERO_ADDRESS, true);

      beforeEach(async () => {
        await registry.register(schema, ZERO_ADDRESS, false);
      });

      beforeEach(async () => {
        delegated = await eas.getDelegated();
      });

      describe('verification', () => {
        describe('attestation', () => {
          it('should throw on offchain verification of invalid attestations', async () => {
            const senderAddress = await sender.getAddress();
            const params = {
              schema: schemaId,
              recipient: await recipient.getAddress(),
              expirationTime: NO_EXPIRATION,
              revocable: false,
              refUID: ZERO_BYTES32,
              data: ZERO_BYTES,
              value: 0n,
              nonce: await eas.getNonce(senderAddress),
              deadline: NO_EXPIRATION
            };

            const response = await delegated.signDelegatedAttestation(params, sender);

            // Invalid attester
            expect(() => delegated.verifyDelegatedAttestationSignature(ZERO_ADDRESS, response)).to.throw(
              'Invalid address'
            );

            // Invalid domains
            const { domain } = response;

            await expect(() =>
              delegated.verifyDelegatedAttestationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, chainId: domain.chainId + 100n } }
              })
            ).to.throw('Invalid domain');

            await expect(() =>
              delegated.verifyDelegatedAttestationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, name: `BAD${domain.name}BAD` } }
              })
            ).to.throw('Invalid domain');

            await expect(() =>
              delegated.verifyDelegatedAttestationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, verifyingContract: ZERO_ADDRESS } }
              })
            ).to.throw('Invalid domain');

            await expect(() =>
              delegated.verifyDelegatedAttestationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, version: '9999.9999.9999' } }
              })
            ).to.throw('Invalid domain');

            // Invalid types
            await expect(() =>
              delegated.verifyDelegatedAttestationSignature(senderAddress, {
                ...response,
                ...{
                  types: { [response.primaryType]: [{ name: 'schema', type: 'bytes32' }] }
                }
              })
            ).to.throw('Invalid types');

            await expect(() =>
              delegated.verifyDelegatedAttestationSignature(senderAddress, {
                ...response,
                ...{
                  types: { BAD: response.types.values }
                }
              })
            ).to.throw('Invalid types');
          });
        });

        describe('revocation', () => {
          it('should throw on offchain verification of invalid revocations', async () => {
            const senderAddress = await sender.getAddress();
            const params = {
              schema: schemaId,
              uid: encodeBytes32String('123'),
              value: 0n,
              nonce: await eas.getNonce(senderAddress),
              deadline: NO_EXPIRATION
            };

            const response = await delegated.signDelegatedRevocation(params, sender);

            // Invalid attester
            expect(() => delegated.verifyDelegatedRevocationSignature(ZERO_ADDRESS, response)).to.throw(
              'Invalid address'
            );

            // Invalid domains
            const { domain } = response;

            await expect(() =>
              delegated.verifyDelegatedRevocationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, chainId: domain.chainId + 100n } }
              })
            ).to.throw('Invalid domain');

            await expect(() =>
              delegated.verifyDelegatedRevocationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, name: `BAD${domain.name}BAD` } }
              })
            ).to.throw('Invalid domain');

            await expect(() =>
              delegated.verifyDelegatedRevocationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, verifyingContract: ZERO_ADDRESS } }
              })
            ).to.throw('Invalid domain');

            await expect(() =>
              delegated.verifyDelegatedRevocationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, version: '9999.9999.9999' } }
              })
            ).to.throw('Invalid domain');

            // Invalid types
            await expect(() =>
              delegated.verifyDelegatedRevocationSignature(senderAddress, {
                ...response,
                ...{
                  types: { [response.primaryType]: [{ name: 'schema', type: 'bytes32' }] }
                }
              })
            ).to.throw('Invalid types');

            await expect(() =>
              delegated.verifyDelegatedRevocationSignature(senderAddress, {
                ...response,
                ...{
                  types: { BAD: response.types.values }
                }
              })
            ).to.throw('Invalid types');
          });
        });
      });
    });

    describe('delegated proxy attestation handling/verification', () => {
      let delegatedProxy: DelegatedProxy;

      const schema = 'bool like';
      const schemaId = getSchemaUID(schema, ZERO_ADDRESS, true);

      beforeEach(async () => {
        await registry.register(schema, ZERO_ADDRESS, false);
      });

      beforeEach(async () => {
        const proxy = await eas.getEIP712Proxy();
        if (!proxy) {
          throw new Error('Invalid proxy');
        }

        delegatedProxy = await proxy.getDelegated();
      });

      describe('verification', () => {
        describe('attestation', () => {
          it('should throw on offchain verification of invalid attestations', async () => {
            const senderAddress = await sender.getAddress();
            const params = {
              schema: schemaId,
              recipient: await recipient.getAddress(),
              expirationTime: NO_EXPIRATION,
              revocable: false,
              refUID: ZERO_BYTES32,
              data: ZERO_BYTES,
              value: 0n,
              nonce: await eas.getNonce(senderAddress),
              deadline: NO_EXPIRATION
            };

            const response = await delegatedProxy.signDelegatedProxyAttestation(params, sender);

            // Invalid attester
            expect(() => delegatedProxy.verifyDelegatedProxyAttestationSignature(ZERO_ADDRESS, response)).to.throw(
              'Invalid address'
            );

            // Invalid domains
            const { domain } = response;

            await expect(() =>
              delegatedProxy.verifyDelegatedProxyAttestationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, chainId: domain.chainId + 100n } }
              })
            ).to.throw('Invalid domain');

            await expect(() =>
              delegatedProxy.verifyDelegatedProxyAttestationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, name: `BAD${domain.name}BAD` } }
              })
            ).to.throw('Invalid domain');

            await expect(() =>
              delegatedProxy.verifyDelegatedProxyAttestationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, verifyingContract: ZERO_ADDRESS } }
              })
            ).to.throw('Invalid domain');

            await expect(() =>
              delegatedProxy.verifyDelegatedProxyAttestationSignature(senderAddress, {
                ...response,
                ...{ domain: { ...domain, version: '9999.9999.9999' } }
              })
            ).to.throw('Invalid domain');

            // Invalid types
            await expect(() =>
              delegatedProxy.verifyDelegatedProxyAttestationSignature(senderAddress, {
                ...response,
                ...{
                  types: { [response.primaryType]: [{ name: 'schema', type: 'bytes32' }] }
                }
              })
            ).to.throw('Invalid types');

            await expect(() =>
              delegatedProxy.verifyDelegatedProxyAttestationSignature(senderAddress, {
                ...response,
                ...{
                  types: { BAD: response.types.values }
                }
              })
            ).to.throw('Invalid types');
          });
        });
      });

      describe('revocation', () => {
        it('should throw on offchain verification of invalid revocations', async () => {
          const senderAddress = await sender.getAddress();
          const params = {
            schema: schemaId,
            uid: encodeBytes32String('123'),
            value: 0n,
            nonce: await eas.getNonce(senderAddress),
            deadline: NO_EXPIRATION
          };

          const response = await delegatedProxy.signDelegatedProxyRevocation(params, sender);

          // Invalid attester
          expect(() => delegatedProxy.verifyDelegatedProxyRevocationSignature(ZERO_ADDRESS, response)).to.throw(
            'Invalid address'
          );

          // Invalid domains
          const { domain } = response;

          await expect(() =>
            delegatedProxy.verifyDelegatedProxyRevocationSignature(senderAddress, {
              ...response,
              ...{ domain: { ...domain, chainId: domain.chainId + 100n } }
            })
          ).to.throw('Invalid domain');

          await expect(() =>
            delegatedProxy.verifyDelegatedProxyRevocationSignature(senderAddress, {
              ...response,
              ...{ domain: { ...domain, name: `BAD${domain.name}BAD` } }
            })
          ).to.throw('Invalid domain');

          await expect(() =>
            delegatedProxy.verifyDelegatedProxyRevocationSignature(senderAddress, {
              ...response,
              ...{ domain: { ...domain, verifyingContract: ZERO_ADDRESS } }
            })
          ).to.throw('Invalid domain');

          await expect(() =>
            delegatedProxy.verifyDelegatedProxyRevocationSignature(senderAddress, {
              ...response,
              ...{ domain: { ...domain, version: '9999.9999.9999' } }
            })
          ).to.throw('Invalid domain');

          // Invalid types
          await expect(() =>
            delegatedProxy.verifyDelegatedProxyRevocationSignature(senderAddress, {
              ...response,
              ...{
                types: { [response.primaryType]: [{ name: 'schema', type: 'bytes32' }] }
              }
            })
          ).to.throw('Invalid types');

          await expect(() =>
            delegatedProxy.verifyDelegatedProxyRevocationSignature(senderAddress, {
              ...response,
              ...{
                types: { BAD: response.types.values }
              }
            })
          ).to.throw('Invalid types');
        });
      });
    });
  });
});
