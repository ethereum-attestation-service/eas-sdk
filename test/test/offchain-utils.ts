import {
  AttestationShareablePackageObject,
  createOffchainURL,
  decodeBase64ZippedBase64,
  EAS,
  Offchain,
  OffChainAttestationVersion,
  SignedOffchainAttestation,
  zipAndEncodeToBase64
} from '../../src';
import { ZERO_ADDRESS } from '../utils/Constants';
import chai from './helpers/chai';

const { expect } = chai;

interface Spec {
  attestation: AttestationShareablePackageObject;
  encoded: string;
  url: string;
}

const TEST_ATTESTATIONS: Spec[] = [
  {
    attestation: {
      sig: {
        version: OffChainAttestationVersion.Version2,
        domain: {
          name: 'EAS Attestation',
          version: '1.3.0',
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
            },
            {
              name: 'salt',
              type: 'bytes32'
            }
          ]
        },
        signature: {
          v: 28,
          r: '0x086528faabfc6eafc046c711577b603f0123e79383469abaedd9ff7ce38028fd',
          s: '0x22c1f437874575bf74936a7d1a114c789f2a53e7d986c2c46fa60b6ed43d7351'
        },
        uid: '0x854d8e26b2bbdc3577fc78c6d2f512258fcc9b91a60858985a216c0ef526ee82',
        message: {
          version: OffChainAttestationVersion.Version2,
          schema: '0x33e9094830a5cba5554d1954310e4fbed2ef5f859ec1404619adea4207f391fd',
          recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          time: 1690299812n,
          expirationTime: 1692891810n,
          revocable: true,
          refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
          data: '0x',
          salt: '0x0000000000000000000000000000000000000000000000000000000000000123',
          nonce: 0n
        }
      },
      signer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    },
    encoded:
      'eNqlks1OHEEMhN9lzgi13X9ublnISNyT3N1uG0aCWTQMiCjKu8e7m+QepY9211cuyz+mo5k88rJ+0+11Oa7TDV5Nclz3jWX/W5vgOl6HyTunr/fDKxFirF55122x78v6cPtb5L3wUQw/JzwcEtSi7VONGZn6TEQFcz5om+MdDogO2M6CQCUjGXM3KcomIRWpALnWXkK0ABi1tkgxlcaddYxmVkUjBdcNB72eQYgClmKlmnLN3WpqsXAdwABJKjVDzo4ajYqgpGJcQi86Uhw+Jpwi+RLIecvDqpfpLLZ5FM3APIjmMifRwgcirFibmM29IZbi4rdlnCWU0yDF0rH3IdFzmLtLGWgZEDOZSOsN3J0yNcqMUCSoZSyqhKdA8qjPfKbFqC20RDFwls45Ox1aThGCJus60IVGualA8tVB46GcMFQfHc7r2VSWl0XX/V8T7cuzTjdQWsDWCPw+9ONl2Xj30/jyp4fUgCCcbOzr/d3J4+z5fhTuT/5n3970ahq8XwKd4vHTZZbwP8/vwlnrcRU3CT9/AU+pxEI=',
    url: '/offchain/url/#attestation=eNqlks1OHEEMhN9lzgi13X9ublnISNyT3N1uG0aCWTQMiCjKu8e7m%2BQepY9211cuyz%2Bmo5k88rJ%2B0%2B11Oa7TDV5Nclz3jWX%2FW5vgOl6HyTunr%2FfDKxFirF55122x78v6cPtb5L3wUQw%2FJzwcEtSi7VONGZn6TEQFcz5om%2BMdDogO2M6CQCUjGXM3KcomIRWpALnWXkK0ABi1tkgxlcaddYxmVkUjBdcNB72eQYgClmKlmnLN3WpqsXAdwABJKjVDzo4ajYqgpGJcQi86Uhw%2BJpwi%2BRLIecvDqpfpLLZ5FM3APIjmMifRwgcirFibmM29IZbi4rdlnCWU0yDF0rH3IdFzmLtLGWgZEDOZSOsN3J0yNcqMUCSoZSyqhKdA8qjPfKbFqC20RDFwls45Ox1aThGCJus60IVGualA8tVB46GcMFQfHc7r2VSWl0XX%2FV8T7cuzTjdQWsDWCPw%2B9ONl2Xj30%2Fjyp4fUgCCcbOzr%2Fd3J4%2Bz5fhTuT%2F5n3970ahq8XwKd4vHTZZbwP8%2FvwlnrcRU3CT9%2FAU%2BpxEI%3D'
  },
  {
    attestation: {
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
          version: OffChainAttestationVersion.Version1,
          schema: '0x33e9094830a5cba5554d1954310e4fbed2ef5f859ec1404619adea4207f391fd',
          recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          time: 1690299812n,
          expirationTime: 1692891810n,
          revocable: true,
          refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
          data: '0x',
          nonce: 0n
        }
      } as unknown as SignedOffchainAttestation,
      signer: '0x8f80b8f45cA0F036da46fFA4D9e5e42D086fB302'
    },
    encoded:
      'eNolkElqJEEMRe+S68RoDmlZSTkvYXoRg3SAxoY+fke5VvofpCd4Xwd+wAcc58HI3PaEf1b0KXRdgs0yHo2Vuo/b3Y1Ur4ybn7SQ38valkrLbnOBM2uj3pcD6AJI9mq5sEUfsaP1AibYbeLYVyL6C+EAbXN2KWqx2EzdaQxB8FbkWDKdysds5DGWW+z/4qFoY8zqx0ntxfFyGF6i8wE3sK0uVvdDnpGaQk9wq4uB3k91zFWTw7Ih95miyDXQbFCflGq7IqX0XLp0rmHcQLEplCWMN4QzIMQZus7RVVUWhgojpNTIRVlarpETBcQw+souBK04sNYvZMd7WSq+zPltt8y0fm0HbfuYVfcIIrPjRAugCEd6xS0DHWEjjvP770++WMcJJ/75D9TveT0=',
    url: '/offchain/url/#attestation=eNolkElqJEEMRe%2BS68RoDmlZSTkvYXoRg3SAxoY%2Bfke5VvofpCd4Xwd%2BwAcc58HI3PaEf1b0KXRdgs0yHo2Vuo%2Fb3Y1Ur4ybn7SQ38valkrLbnOBM2uj3pcD6AJI9mq5sEUfsaP1AibYbeLYVyL6C%2BEAbXN2KWqx2EzdaQxB8FbkWDKdysds5DGWW%2Bz%2F4qFoY8zqx0ntxfFyGF6i8wE3sK0uVvdDnpGaQk9wq4uB3k91zFWTw7Ih95miyDXQbFCflGq7IqX0XLp0rmHcQLEplCWMN4QzIMQZus7RVVUWhgojpNTIRVlarpETBcQw%2BsouBK04sNYvZMd7WSq%2BzPltt8y0fm0HbfuYVfcIIrPjRAugCEd6xS0DHWEjjvP770%2B%2BWMcJJ%2F75D9TveT0%3D'
  }
];

describe('offchain utils', () => {
  for (const { attestation, encoded, url } of TEST_ATTESTATIONS) {
    context(`version ${attestation.sig.message.version}`, () => {
      describe('encode', () => {
        it('should zip and encode an offchain attestation object', () => {
          expect(zipAndEncodeToBase64(attestation)).to.equal(encoded);
        });

        it('should encode into a URL', () => {
          expect(createOffchainURL(attestation)).to.equal(url);
        });
      });

      describe('decode', () => {
        it('should unzip and decode an an encoded attestation string', () => {
          const decoded = decodeBase64ZippedBase64(encoded);
          expect(decoded).to.not.be.null;

          const offchain = new Offchain(
            {
              chainId: attestation.sig.domain.chainId,
              address: attestation.sig.domain.verifyingContract,
              version: attestation.sig.domain.version
            },
            attestation.sig.message.version,
            new EAS(ZERO_ADDRESS)
          );

          expect(
            offchain.verifyOffchainAttestationSignature(attestation.signer, decoded.sig as SignedOffchainAttestation)
          ).to.be.true;
        });
      });
    });
  }
});
