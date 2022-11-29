import { EAS, NO_EXPIRATION } from '../../src/eas';
import { SchemaRegistry } from '../../src/schema-registry';
import { getOffchainUUID, getSchemaUUID } from '../../src/utils';
import Contracts from '../components/Contracts';
import { ZERO_ADDRESS, ZERO_BYTES, ZERO_BYTES32 } from '../utils/Constants';
import chai from './helpers/chai';
import { EIP712Utils } from './helpers/EIP712Utils';
import { duration, latest } from './helpers/time';
import { createWallet, Wallet } from './helpers/wallet';
import {
  EAS as EASContract,
  EIP712Verifier,
  SchemaRegistry as SchemaRegistryContract
} from '@ethereum-attestation-service/eas-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumberish } from 'ethers';
import { ethers } from 'hardhat';

const { expect } = chai;

describe('EAS API', () => {
  let accounts: SignerWithAddress[];
  let sender: Wallet;
  let recipient: SignerWithAddress;
  let recipient2: SignerWithAddress;

  let registry: SchemaRegistryContract;
  let verifier: EIP712Verifier;
  let easContract: EASContract;
  let eip712Utils: EIP712Utils;

  let eas: EAS;
  let schemaRegistry: SchemaRegistry;

  before(async () => {
    accounts = await ethers.getSigners();

    [recipient, recipient2] = accounts;
  });

  beforeEach(async () => {
    sender = await createWallet();

    registry = await Contracts.SchemaRegistry.deploy();
    verifier = await Contracts.EIP712Verifier.deploy();
    eip712Utils = new EIP712Utils(verifier.address);

    easContract = await Contracts.EAS.deploy(registry.address, verifier.address);

    eas = new EAS(easContract.address);
    eas.connect(sender);

    schemaRegistry = new SchemaRegistry(registry.address);
    schemaRegistry.connect(sender);
  });

  interface Options {
    from?: Wallet;
    value?: BigNumberish;
    bump?: number;
  }

  enum SignatureType {
    Direct = 'direct',
    Delegated = 'delegated',
    Offchain = 'offchain'
  }

  describe('attesting', () => {
    let expirationTime: number;
    const data = '0x1234';

    beforeEach(async () => {
      expirationTime = (await latest()) + duration.days(30);
    });

    for (const signatureType of [SignatureType.Direct, SignatureType.Delegated, SignatureType.Offchain]) {
      context(`via ${signatureType} attestation`, () => {
        const expectAttestation = async (
          recipient: string,
          schema: string,
          expirationTime: number,
          revocable: boolean,
          refUUID: string,
          data: string,
          options?: Options
        ) => {
          const txSender = options?.from || sender;

          let uuid;

          switch (signatureType) {
            case SignatureType.Direct: {
              uuid = await eas.connect(txSender).attest(recipient, schema, data, expirationTime, revocable, refUUID, {
                value: options?.value
              });

              break;
            }

            case SignatureType.Delegated: {
              const request = await eip712Utils.signDelegatedAttestation(
                txSender,
                recipient,
                schema,
                expirationTime,
                revocable,
                refUUID,
                data,
                await verifier.getNonce(txSender.address)
              );

              expect(await eip712Utils.verifyDelegatedAttestationSignature(txSender.address, request)).to.be.true;

              uuid = await eas
                .connect(txSender)
                .attestByDelegation(
                  recipient,
                  schema,
                  data,
                  txSender.address,
                  request,
                  expirationTime,
                  revocable,
                  refUUID,
                  {
                    value: options?.value
                  }
                );

              break;
            }

            case SignatureType.Offchain: {
              const now = await latest();
              const uuid = getOffchainUUID(schema, recipient, now, expirationTime, revocable, refUUID, data);
              const request = await eip712Utils.signOffchainAttestation(
                txSender,
                schema,
                recipient,
                now,
                expirationTime,
                revocable,
                refUUID,
                data
              );
              expect(request.uuid).to.equal(uuid);
              expect(await eip712Utils.verifyOffchainAttestation(txSender.address, request));

              return;
            }
          }

          expect(await eas.isAttestationValid(uuid)).to.be.true;

          const now = await latest();

          const attestation = await eas.getAttestation(uuid);
          expect(attestation.uuid).to.equal(uuid);
          expect(attestation.schema).to.equal(schema);
          expect(attestation.recipient).to.equal(recipient);
          expect(attestation.attester).to.equal(txSender.address);
          expect(attestation.time).to.equal(now);
          expect(attestation.expirationTime).to.equal(expirationTime);
          expect(attestation.revocationTime).to.equal(0);
          expect(attestation.revocable).to.equal(revocable);
          expect(attestation.refUUID).to.equal(refUUID);
          expect(attestation.data).to.equal(data);

          return uuid;
        };

        context('with a registered schema', () => {
          const schema1 = 'S1';
          const schema2 = 'S2';
          const schema1Id = getSchemaUUID(schema1, ZERO_ADDRESS);
          const schema2Id = getSchemaUUID(schema2, ZERO_ADDRESS);

          beforeEach(async () => {
            await schemaRegistry.register(schema1, ZERO_ADDRESS);
            await schemaRegistry.register(schema2, ZERO_ADDRESS);
          });

          it('should allow attestation to an empty recipient', async () => {
            await expectAttestation(ZERO_ADDRESS, schema1Id, expirationTime, true, ZERO_BYTES32, data);
          });

          it('should allow self attestations', async () => {
            await expectAttestation(sender.address, schema2Id, expirationTime, true, ZERO_BYTES32, data, {
              from: sender
            });
          });

          it('should allow multiple attestations', async () => {
            await expectAttestation(recipient.address, schema1Id, expirationTime, true, ZERO_BYTES32, data);
            await expectAttestation(recipient2.address, schema1Id, expirationTime, true, ZERO_BYTES32, data);
          });

          it('should allow attestation without expiration time', async () => {
            await expectAttestation(recipient.address, schema1Id, NO_EXPIRATION, true, ZERO_BYTES32, data);
          });

          it('should allow attestation without any data', async () => {
            await expectAttestation(recipient.address, schema1Id, expirationTime, true, ZERO_BYTES32, ZERO_BYTES);
          });

          it('should store referenced attestation', async () => {
            const uuid = await eas.attest(recipient.address, schema1Id, data, expirationTime);

            await expectAttestation(recipient.address, schema1Id, expirationTime, true, uuid, data);
          });
        });
      });
    }
  });

  describe('revocation', () => {
    const schema1 = 'S1';
    const schema1Id = getSchemaUUID(schema1, ZERO_ADDRESS);
    let uuid: string;
    const data = '0x1234';

    beforeEach(async () => {
      await schemaRegistry.register(schema1, ZERO_ADDRESS);
    });

    for (const signatureType of [SignatureType.Direct, SignatureType.Delegated]) {
      context(`via ${signatureType} attestation`, () => {
        const expectRevocation = async (uuid: string, options?: Options) => {
          const txSender = options?.from || sender;

          switch (signatureType) {
            case SignatureType.Direct: {
              await eas.connect(txSender).revoke(uuid);

              break;
            }

            case SignatureType.Delegated: {
              const request = await eip712Utils.signDelegatedRevocation(
                txSender,
                uuid,
                await verifier.getNonce(txSender.address)
              );

              expect(await eip712Utils.verifyDelegatedRevocationSignature(txSender.address, request)).to.be.true;

              await eas.connect(txSender).revokeByDelegation(uuid, txSender.address, request);

              break;
            }
          }

          const now = await latest();

          const attestation = await eas.getAttestation(uuid);
          expect(attestation.revocationTime).to.equal(now);
        };

        beforeEach(async () => {
          uuid = await eas.attest(recipient.address, schema1Id, data);
        });

        it('should allow to revoke an existing attestation', async () => {
          await expectRevocation(uuid);
        });
      });
    }
  });
});
