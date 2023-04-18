import { getOffchainUID } from '../utils';
import { EIP712_NAME } from './delegated';
import { TypedDataHandler } from './typed-data-handler';
import { utils } from 'ethers';
const { keccak256, toUtf8Bytes, defaultAbiCoder } = utils;
export const ATTESTATION_PRIMARY_TYPE = 'Attestation';
export const ATTESTATION_TYPE = [
    { name: 'schema', type: 'bytes32' },
    { name: 'recipient', type: 'address' },
    { name: 'time', type: 'uint64' },
    { name: 'expirationTime', type: 'uint64' },
    { name: 'revocable', type: 'bool' },
    { name: 'refUID', type: 'bytes32' },
    { name: 'data', type: 'bytes' }
];
export const DOMAIN_NAME = 'EAS Attestation';
export class Offchain extends TypedDataHandler {
    constructor(config) {
        super({ ...config, name: EIP712_NAME });
    }
    getDomainSeparator() {
        return keccak256(defaultAbiCoder.encode(['bytes32', 'bytes32', 'uint256', 'address'], [
            keccak256(toUtf8Bytes(DOMAIN_NAME)),
            keccak256(toUtf8Bytes(this.config.version)),
            this.config.chainId,
            this.config.address
        ]));
    }
    getDomainTypedData() {
        return {
            name: DOMAIN_NAME,
            version: this.config.version,
            chainId: this.config.chainId,
            verifyingContract: this.config.address
        };
    }
    async signOffchainAttestation(params, signer) {
        const uid = Offchain.getOffchainUID(params);
        const signedRequest = await this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: ATTESTATION_PRIMARY_TYPE,
            message: params,
            types: {
                Attest: ATTESTATION_TYPE
            }
        }, signer);
        return {
            ...signedRequest,
            uid
        };
    }
    verifyOffchainAttestationSignature(attester, request) {
        return (request.uid === Offchain.getOffchainUID(request.message) &&
            this.verifyTypedDataRequestSignature(attester, request));
    }
    static getOffchainUID(params) {
        return getOffchainUID(params.schema, params.recipient, params.time, params.expirationTime, params.revocable, params.refUID, params.data);
    }
}
//# sourceMappingURL=offchain.js.map