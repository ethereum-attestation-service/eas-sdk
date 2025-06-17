import { AbiCoder, getAddress, hexlify, keccak256, Signature as Sig, toUtf8Bytes, verifyTypedData } from 'ethers';
import isEqual from 'lodash/isEqual';
import { ZERO_ADDRESS } from '../utils';
export const EIP712_DOMAIN = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
export class InvalidDomain extends Error {
}
export class InvalidPrimaryType extends Error {
}
export class InvalidTypes extends Error {
}
export class InvalidAddress extends Error {
}
export class TypedDataHandler {
    config;
    constructor(config) {
        this.config = config;
    }
    getDomainSeparator() {
        return TypedDataHandler.getDomainSeparator(this.config);
    }
    static getDomainSeparator(config) {
        return keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'], [
            keccak256(toUtf8Bytes(EIP712_DOMAIN)),
            keccak256(toUtf8Bytes(config.name)),
            keccak256(toUtf8Bytes(config.version)),
            config.chainId,
            config.address
        ]));
    }
    getDomainTypedData() {
        return {
            name: this.config.name,
            version: this.config.version,
            chainId: this.config.chainId,
            verifyingContract: this.config.address
        };
    }
    async signTypedDataRequest(params, types, signer) {
        const rawSignature = await signer.signTypedData(types.domain, types.types, params);
        const signature = Sig.from(rawSignature);
        return { ...types, signature: { v: signature.v, r: signature.r, s: signature.s } };
    }
    verifyTypedDataRequestSignature(attester, response, types, strict = true) {
        // Normalize the chain ID
        const domain = { ...response.domain, chainId: BigInt(response.domain.chainId) };
        let expectedDomain = this.getDomainTypedData();
        if (!strict) {
            expectedDomain = { ...expectedDomain, version: domain.version };
        }
        if (!isEqual(domain, expectedDomain)) {
            throw new InvalidDomain();
        }
        if (response.primaryType !== types.primaryType) {
            throw new InvalidPrimaryType();
        }
        if (!isEqual(response.types, types.types)) {
            throw new InvalidTypes();
        }
        if (attester === ZERO_ADDRESS) {
            throw new InvalidAddress();
        }
        const { signature } = response;
        const sig = Sig.from({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) }).serialized;
        const recoveredAddress = verifyTypedData(domain, response.types, response.message, sig);
        return getAddress(attester) === getAddress(recoveredAddress);
    }
}
//# sourceMappingURL=typed-data-handler.js.map