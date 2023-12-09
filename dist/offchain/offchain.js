"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Offchain = exports.SALT_SIZE = exports.OFFCHAIN_ATTESTATION_TYPES = exports.OffChainAttestationVersion = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("../utils");
const delegated_1 = require("./delegated");
const typed_data_handler_1 = require("./typed-data-handler");
var OffChainAttestationVersion;
(function (OffChainAttestationVersion) {
    OffChainAttestationVersion[OffChainAttestationVersion["Legacy"] = 0] = "Legacy";
    OffChainAttestationVersion[OffChainAttestationVersion["Version1"] = 1] = "Version1";
    OffChainAttestationVersion[OffChainAttestationVersion["Version2"] = 2] = "Version2";
})(OffChainAttestationVersion || (exports.OffChainAttestationVersion = OffChainAttestationVersion = {}));
exports.OFFCHAIN_ATTESTATION_TYPES = {
    [OffChainAttestationVersion.Legacy]: [
        {
            domain: 'EAS Attestation',
            primaryType: 'Attestation',
            types: {
                Attestation: [
                    { name: 'schema', type: 'bytes32' },
                    { name: 'recipient', type: 'address' },
                    { name: 'time', type: 'uint64' },
                    { name: 'expirationTime', type: 'uint64' },
                    { name: 'revocable', type: 'bool' },
                    { name: 'refUID', type: 'bytes32' },
                    { name: 'data', type: 'bytes' }
                ]
            }
        },
        {
            domain: 'EAS Attestation',
            primaryType: 'Attestation',
            types: {
                Attest: [
                    { name: 'schema', type: 'bytes32' },
                    { name: 'recipient', type: 'address' },
                    { name: 'time', type: 'uint64' },
                    { name: 'expirationTime', type: 'uint64' },
                    { name: 'revocable', type: 'bool' },
                    { name: 'refUID', type: 'bytes32' },
                    { name: 'data', type: 'bytes' }
                ]
            }
        },
        {
            domain: 'EAS Attestation',
            primaryType: 'Attest',
            types: {
                Attest: [
                    { name: 'schema', type: 'bytes32' },
                    { name: 'recipient', type: 'address' },
                    { name: 'time', type: 'uint64' },
                    { name: 'expirationTime', type: 'uint64' },
                    { name: 'revocable', type: 'bool' },
                    { name: 'refUID', type: 'bytes32' },
                    { name: 'data', type: 'bytes' }
                ]
            }
        }
    ],
    [OffChainAttestationVersion.Version1]: [
        {
            domain: 'EAS Attestation',
            primaryType: 'Attest',
            types: {
                Attest: [
                    { name: 'version', type: 'uint16' },
                    { name: 'schema', type: 'bytes32' },
                    { name: 'recipient', type: 'address' },
                    { name: 'time', type: 'uint64' },
                    { name: 'expirationTime', type: 'uint64' },
                    { name: 'revocable', type: 'bool' },
                    { name: 'refUID', type: 'bytes32' },
                    { name: 'data', type: 'bytes' }
                ]
            }
        }
    ],
    [OffChainAttestationVersion.Version2]: [
        {
            domain: 'EAS Attestation',
            primaryType: 'Attest',
            types: {
                Attest: [
                    { name: 'version', type: 'uint16' },
                    { name: 'schema', type: 'bytes32' },
                    { name: 'recipient', type: 'address' },
                    { name: 'time', type: 'uint64' },
                    { name: 'expirationTime', type: 'uint64' },
                    { name: 'revocable', type: 'bool' },
                    { name: 'refUID', type: 'bytes32' },
                    { name: 'data', type: 'bytes' },
                    { name: 'salt', type: 'bytes32' }
                ]
            }
        }
    ]
};
const DEFAULT_OFFCHAIN_ATTESTATION_OPTIONS = {
    verifyOnchain: false
};
exports.SALT_SIZE = 32;
class Offchain extends typed_data_handler_1.TypedDataHandler {
    version;
    signingType;
    verificationTypes;
    eas;
    constructor(config, version, eas) {
        if (version > OffChainAttestationVersion.Version2) {
            throw new Error('Unsupported version');
        }
        super({ ...config, name: delegated_1.EIP712_NAME });
        this.version = version;
        this.verificationTypes = exports.OFFCHAIN_ATTESTATION_TYPES[this.version];
        this.signingType = this.verificationTypes[0];
        this.eas = eas;
    }
    getDomainSeparator() {
        return (0, ethers_1.keccak256)(ethers_1.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32', 'uint256', 'address'], [
            (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(this.signingType.domain)),
            (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(this.config.version)),
            this.config.chainId,
            this.config.address
        ]));
    }
    getDomainTypedData() {
        return {
            name: this.signingType.domain,
            version: this.config.version,
            chainId: this.config.chainId,
            verifyingContract: this.config.address
        };
    }
    async signOffchainAttestation(params, signer, options) {
        const typedData = { version: this.version, ...params };
        // If no salt was provided - generate a random salt.
        if (this.version >= OffChainAttestationVersion.Version2 && !typedData.salt) {
            typedData.salt = (0, ethers_1.hexlify)((0, ethers_1.randomBytes)(exports.SALT_SIZE));
        }
        const signedRequest = await this.signTypedDataRequest(typedData, {
            domain: this.getDomainTypedData(),
            primaryType: this.signingType.primaryType,
            message: typedData,
            types: this.signingType.types
        }, signer);
        const { verifyOnchain } = { ...DEFAULT_OFFCHAIN_ATTESTATION_OPTIONS, ...options };
        if (verifyOnchain) {
            try {
                const { schema, recipient, expirationTime, revocable, data } = params;
                // Verify the offchain attestation onchain by simulating a contract call to attest. Since onchain verification
                // makes sure that any referenced attestations exist, we will set refUID to ZERO_BYTES32.
                await this.eas.contract.attest.staticCall({ schema, data: { recipient, expirationTime, revocable, refUID: utils_1.ZERO_BYTES32, data, value: 0 } }, { from: signer });
            }
            catch (e) {
                throw new Error(`Unable to verify offchain attestation with: ${e}`);
            }
        }
        return {
            version: this.version,
            uid: this.getOffchainUID(typedData),
            ...signedRequest
        };
    }
    verifyOffchainAttestationSignature(attester, attestation) {
        if (attestation.uid !== Offchain.getOffchainUID(this.version, attestation)) {
            return false;
        }
        const typeCount = this.verificationTypes.length;
        return this.verificationTypes.some((type, index) => {
            try {
                return this.verifyTypedDataRequestSignature(attester, attestation, {
                    primaryType: type.primaryType,
                    types: type.types
                }, false);
            }
            catch (e) {
                if (index !== typeCount - 1 && (e instanceof typed_data_handler_1.InvalidPrimaryType || e instanceof typed_data_handler_1.InvalidTypes)) {
                    return false;
                }
                throw e;
            }
        });
    }
    getOffchainUID(params) {
        return (0, utils_1.getOffchainUID)(this.version, params.schema, params.recipient, params.time, params.expirationTime, params.revocable, params.refUID, params.data, params.salt);
    }
    static getOffchainUID(version, attestation) {
        return (0, utils_1.getOffchainUID)(version, attestation.message.schema, attestation.message.recipient, attestation.message.time, attestation.message.expirationTime, attestation.message.revocable, attestation.message.refUID, attestation.message.data, attestation.message.salt);
    }
}
exports.Offchain = Offchain;
//# sourceMappingURL=offchain.js.map