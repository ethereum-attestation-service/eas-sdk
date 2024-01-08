import {
  AttestationShareablePackageObject,
  createOffchainURL,
  decodeBase64ZippedBase64,
  EAS,
  Offchain,
  OffchainAttestationVersion,
  zipAndEncodeToBase64
} from '../../src';
import { ZERO_ADDRESS } from '../utils/Constants';
import chai from './helpers/chai';

const { expect } = chai;

const testAttestation: AttestationShareablePackageObject = {
  sig: {
    domain: {
      name: 'EAS Attestation',
      version: '1.0.0',
      chainId: 31337n,
      verifyingContract: '0x6f2E42BB4176e9A7352a8bF8886255Be9F3D2d13'
    },
    primaryType: 'Attest',
    types: {
      Attest: [
        { name: 'version', type: 'uint16' },
        {
          name: 'schema',
          type: 'bytes32'
        },
        { name: 'recipient', type: 'address' },
        { name: 'time', type: 'uint64' },
        {
          name: 'expirationTime',
          type: 'uint64'
        },
        { name: 'revocable', type: 'bool' },
        { name: 'refUID', type: 'bytes32' },
        {
          name: 'data',
          type: 'bytes'
        }
      ]
    },
    signature: {
      v: 27,
      r: '0x657d547ea6cd0833572aad8005d00e38f7ed179ab98f76af03209abc1b547445',
      s: '0x39057cca4f279d3665882bb41087f281f4c82f8bc7289bd8692d1489516bbcfa'
    },
    uid: '0x35bcdfc396e713ace4513fb166b2ac2e5613f12e4aed5d5cdb637051750f6e0b',
    message: {
      version: 1,
      schema: '0x33e9094830a5cba5554d1954310e4fbed2ef5f859ec1404619adea4207f391fd',
      recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      time: 1690299812n,
      expirationTime: 1692891810n,
      revocable: true,
      refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
      data: '0x',
      nonce: 0n
    }
  },
  signer: '0x8f80b8f45cA0F036da46fFA4D9e5e42D086fB302'
};

const testEncoded =
  'eNolkElqJEEMRe+S68RoDmlZSTkvYXoRg3SAxoY+fke5VvofpCd4Xwd+wAcc58HI3PaEf1b0KXRdgs0yHo2Vuo/b3Y1Ur4ybn7SQ38valkrLbnOBM2uj3pcD6AJI9mq5sEUfsaP1AibYbeLYVyL6C+EAbXN2KWqx2EzdaQxB8FbkWDKdysds5DGWW+z/4qFoY8zqx0ntxfFyGF6i8wE3sK0uVvdDnpGaQk9wq4uB3k91zFWTw7Ih95miyDXQbFCflGq7IqX0XLp0rmHcQLEplCWMN4QzIMQZus7RVVUWhgojpNTIRVlarpETBcQw+souBK04sNYvZMd7WSq+zPltt8y0fm0HbfuYVfcIIrPjRAugCEd6xS0DHWEjjvP770++WMcJJ/75D9TveT0=';
const testURL =
  '/offchain/url/#attestation=eNolkElqJEEMRe%2BS68RoDmlZSTkvYXoRg3SAxoY%2Bfke5VvofpCd4Xwd%2BwAcc58HI3PaEf1b0KXRdgs0yHo2Vuo%2Fb3Y1Ur4ybn7SQ38valkrLbnOBM2uj3pcD6AJI9mq5sEUfsaP1AibYbeLYVyL6C%2BEAbXN2KWqx2EzdaQxB8FbkWDKdysds5DGWW%2Bz%2F4qFoY8zqx0ntxfFyGF6i8wE3sK0uVvdDnpGaQk9wq4uB3k91zFWTw7Ih95miyDXQbFCflGq7IqX0XLp0rmHcQLEplCWMN4QzIMQZus7RVVUWhgojpNTIRVlarpETBcQw%2BsouBK04sNYvZMd7WSq%2BzPltt8y0fm0HbfuYVfcIIrPjRAugCEd6xS0DHWEjjvP770%2B%2BWMcJJ%2F75D9TveT0%3D';

describe('offchain utils', () => {
  describe('encode', () => {
    it('should zip and encode an offchain attestation object', () => {
      const encoded = zipAndEncodeToBase64(testAttestation);
      expect(encoded).to.equal(testEncoded);
    });

    it('should encode into url', () => {
      const url = createOffchainURL(testAttestation);
      expect(url).to.equal(testURL);
    });
  });

  describe('decode', () => {
    it('should unzip and decode an an encoded attestation string', () => {
      const decoded = decodeBase64ZippedBase64(testEncoded);
      expect(decoded).to.not.be.null;

      const offchain = new Offchain(
        {
          chainId: testAttestation.sig.domain.chainId,
          address: testAttestation.sig.domain.verifyingContract,
          version: testAttestation.sig.domain.version
        },
        OffchainAttestationVersion.Version1,
        new EAS(ZERO_ADDRESS)
      );

      const verified = offchain.verifyOffchainAttestationSignature(testAttestation.signer, decoded.sig);
      expect(verified).to.be.true;
    });
  });
});
