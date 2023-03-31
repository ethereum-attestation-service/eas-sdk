import { EAS, NO_EXPIRATION } from '../../src/eas';
import { SchemaRegistry } from '../../src/schema-registry';
import { getSchemaUID, getUIDFromAttestTx } from '../../src/utils';
import Contracts from '../components/Contracts';
import { ZERO_ADDRESS, ZERO_BYTES, ZERO_BYTES32 } from '../utils/Constants';
import chai from './helpers/chai';
import { expectAttestation, expectMultiAttestations, expectMultiRevocations, expectRevocation } from './helpers/eas';
import { EIP712Utils } from './helpers/eip712-utils';
import { OffchainUtils } from './helpers/offchain-utils';
import { duration, latest } from './helpers/time';
import { createWallet, Wallet } from './helpers/wallet';
import {
  EAS as EASContract,
  SchemaRegistry as SchemaRegistryContract
} from '@ethereum-attestation-service/eas-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, waffle } from 'hardhat';

const { expect } = chai;

const {
  utils: { formatBytes32String }
} = ethers;

describe('EAS API', () => {
  let accounts: SignerWithAddress[];
  let sender: Wallet;
  let recipient: SignerWithAddress;
  let recipient2: SignerWithAddress;

  let registry: SchemaRegistryContract;
  let easContract: EASContract;
  let eip712Utils: EIP712Utils;
  let offchainUtils: OffchainUtils;

  let eas: EAS;
  let schemaRegistry: SchemaRegistry;

  before(async () => {
    accounts = await ethers.getSigners();

    [recipient, recipient2] = accounts;
  });

  beforeEach(async () => {
    sender = await createWallet();

    registry = await Contracts.SchemaRegistry.deploy();
    easContract = await Contracts.EAS.deploy(registry.address);

    offchainUtils = await OffchainUtils.fromVerifier(easContract);
    eip712Utils = await EIP712Utils.fromVerifier(easContract);
  });

  enum SignatureType {
    Direct = 'direct',
    Delegated = 'delegated',
    Offchain = 'offchain'
  }

  context('with a provider', () => {
    beforeEach(() => {
      eas = new EAS(easContract.address, waffle.provider);

      schemaRegistry = new SchemaRegistry(registry.address, waffle.provider);
    });

    describe('construction', () => {
      it('should properly create an EAS API', async () => {
        expect(eas.contract.signer).to.be.null;
        expect(eas.contract.provider).not.to.be.null;

        expect(await eas.getVersion()).to.equal(await easContract.VERSION());
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

      it('should not be able to register new schema', () => {
        expect(schemaRegistry.register({ schema, resolverAddress: ZERO_ADDRESS })).to.be.rejectedWith(
          'Error: sending a transaction requires a signer'
        );
      });

      context('with an attestation', () => {
        let uid: string;

        beforeEach(async () => {
          const res = await easContract.attest({
            schema: schemaId,
            data: {
              recipient: recipient.address,
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

        it('should not be able to make new attestations new schema', () => {
          expect(eas.getAttestation(uid)).to.be.rejectedWith('Error: sending a transaction requires a signer');
        });
      });
    });
  });

  context('with a signer', () => {
    beforeEach(() => {
      eas = new EAS(easContract.address, sender);
      schemaRegistry = new SchemaRegistry(registry.address, sender);
    });

    describe('attesting', () => {
      let expirationTime: number;
      const data = '0x1234';

      beforeEach(async () => {
        expirationTime = (await latest()) + duration.days(30);
      });

      for (const signatureType of [SignatureType.Direct, SignatureType.Delegated, SignatureType.Offchain]) {
        context(`via ${signatureType} attestation`, () => {
          for (const revocable of [true, false]) {
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
                  { eas, eip712Utils, offchainUtils },
                  schema1Id,
                  {
                    recipient: ZERO_ADDRESS,
                    expirationTime,
                    revocable,
                    data
                  },
                  { signatureType, from: sender }
                );
              });

              it('should allow self attestations', async () => {
                await expectAttestation(
                  { eas, eip712Utils, offchainUtils },
                  schema1Id,
                  { recipient: sender.address, expirationTime, revocable, data },
                  { signatureType, from: sender }
                );
              });

              it('should allow multiple attestations', async () => {
                await expectAttestation(
                  { eas, eip712Utils, offchainUtils },
                  schema1Id,
                  { recipient: recipient.address, expirationTime, revocable, data },
                  { signatureType, from: sender }
                );

                await expectAttestation(
                  { eas, eip712Utils, offchainUtils },
                  schema1Id,
                  { recipient: recipient2.address, expirationTime, revocable, data },
                  { signatureType, from: sender }
                );
              });

              if (signatureType !== SignatureType.Offchain) {
                it('should allow multi attestations', async () => {
                  await expectMultiAttestations(
                    { eas, eip712Utils },
                    [
                      {
                        schema: schema1Id,
                        data: [
                          { recipient: recipient.address, expirationTime, revocable, data },
                          { recipient: recipient2.address, expirationTime, revocable, data }
                        ]
                      },
                      {
                        schema: schema2Id,
                        data: [
                          { recipient: recipient.address, expirationTime, revocable, data },
                          { recipient: recipient2.address, expirationTime, revocable, data }
                        ]
                      }
                    ],
                    { signatureType, from: sender }
                  );
                });
              }

              it('should allow attestation without expiration time', async () => {
                await expectAttestation(
                  { eas, eip712Utils, offchainUtils },
                  schema1Id,
                  { recipient: recipient.address, expirationTime: NO_EXPIRATION, revocable, data },
                  { signatureType, from: sender }
                );
              });

              it('should allow attestation without any data', async () => {
                await expectAttestation(
                  { eas, eip712Utils, offchainUtils },
                  schema1Id,
                  { recipient: recipient.address, expirationTime, revocable, data: ZERO_BYTES },
                  { signatureType, from: sender }
                );
              });

              it('should store referenced attestation', async () => {
                const uid = await (
                  await eas.attest({
                    schema: schema1Id,
                    data: { recipient: recipient.address, expirationTime, revocable, data }
                  })
                ).wait();

                await expectAttestation(
                  { eas, eip712Utils, offchainUtils },
                  schema1Id,
                  { recipient: recipient.address, expirationTime, revocable, refUID: uid, data },
                  { signatureType, from: sender }
                );
              });

              if (signatureType === SignatureType.Offchain) {
                it('should verify the uid of an offchain attestation', async () => {
                  const response = await offchainUtils.signAttestation(
                    sender,
                    schema1Id,
                    recipient,
                    await latest(),
                    expirationTime,
                    revocable,
                    ZERO_BYTES32,
                    data
                  );

                  expect(await offchainUtils.verifyAttestation(sender.address, response)).to.be.true;

                  const request2 = await offchainUtils.signAttestation(
                    sender,
                    schema1Id,
                    recipient,
                    await latest(),
                    expirationTime,
                    revocable,
                    ZERO_BYTES32,
                    data,
                    '1234'
                  );

                  expect(await offchainUtils.verifyAttestation(sender.address, request2)).to.be.false;
                });
              }
            });
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
      const data = '0x1234';

      beforeEach(async () => {
        const tx1 = await schemaRegistry.register({ schema: schema1 });
        const tx2 = await schemaRegistry.register({ schema: schema2 });

        schema1Id = await tx1.wait();
        schema2Id = await tx2.wait();
      });

      for (const signatureType of [SignatureType.Direct, SignatureType.Delegated]) {
        context(`via ${signatureType} revocation`, () => {
          beforeEach(async () => {
            const tx1 = await eas.attest({ schema: schema1Id, data: { recipient: recipient.address, data } });
            const tx2 = await eas.attest({ schema: schema1Id, data: { recipient: recipient.address, data } });

            uids1 = [await tx1.wait(), await tx2.wait()];

            const tx3 = await eas.attest({ schema: schema2Id, data: { recipient: recipient.address, data } });
            const tx4 = await eas.attest({ schema: schema2Id, data: { recipient: recipient.address, data } });

            uids2 = [await tx3.wait(), await tx4.wait()];
          });

          it('should allow to revoke existing attestations', async () => {
            for (const uid of uids1) {
              await expectRevocation({ eas, eip712Utils }, schema1Id, { uid }, { signatureType, from: sender });
            }

            for (const uid of uids2) {
              await expectRevocation({ eas, eip712Utils }, schema2Id, { uid }, { signatureType, from: sender });
            }
          });

          it('should allow to multi-revoke existing attestations', async () => {
            await expectMultiRevocations(
              { eas, eip712Utils },
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
              { signatureType, from: sender }
            );
          });
        });
      }
    });

    describe('timestamping', () => {
      const data1 = formatBytes32String('0x1234');
      const data2 = formatBytes32String('0x4567');
      const data3 = formatBytes32String('0x6666');

      it('should timestamp a single data', async () => {
        const tx = await eas.timestamp(data1);
        const timestamp = await tx.wait();
        expect(timestamp).to.equal(await latest());

        expect(await eas.getTimestamp(data1)).to.equal(timestamp);

        const tx2 = await eas.timestamp(data2);
        const timestamp2 = await tx2.wait();
        expect(timestamp2).to.equal(await latest());

        expect(await eas.getTimestamp(data2)).to.equal(timestamp2);
      });

      it('should timestamp multiple data', async () => {
        const data = [data1, data2];
        const tx = await eas.multiTimestamp([data1, data2]);
        const timestamps = await tx.wait();

        const currentTime = await latest();

        for (const [i, d] of data.entries()) {
          const timestamp = timestamps[i];
          expect(timestamp).to.equal(currentTime);

          expect(await eas.getTimestamp(d)).to.equal(timestamp);
        }
      });

      it("should return 0 for any data that wasn't timestamped multiple data", async () => {
        expect(await eas.getTimestamp(data3)).to.equal(0);
      });
    });

    describe('revoking offchain', () => {
      const data1 = formatBytes32String('0x1234');
      const data2 = formatBytes32String('0x4567');
      const data3 = formatBytes32String('0x6666');

      it('should revoke a single data', async () => {
        const tx = await eas.revokeOffchain(data1);
        const timestamp = await tx.wait();
        expect(timestamp).to.equal(await latest());

        expect(await eas.getRevocationOffchain(sender.address, data1)).to.equal(timestamp);

        const tx2 = await eas.revokeOffchain(data2);
        const timestamp2 = await tx2.wait();
        expect(timestamp2).to.equal(await latest());

        expect(await eas.getRevocationOffchain(sender.address, data2)).to.equal(timestamp2);
      });

      it('should revoke multiple data', async () => {
        const data = [data1, data2];
        const tx = await eas.multiRevokeOffchain([data1, data2]);
        const timestamps = await tx.wait();

        const currentTime = await latest();

        for (const [i, d] of data.entries()) {
          const timestamp = timestamps[i];
          expect(timestamp).to.equal(currentTime);

          expect(await eas.getRevocationOffchain(sender.address, d)).to.equal(timestamp);
        }
      });

      it("should return 0 for any data that wasn't revoked multiple data", async () => {
        expect(await eas.getRevocationOffchain(sender.address, data3)).to.equal(0);
      });
    });
  });
});
