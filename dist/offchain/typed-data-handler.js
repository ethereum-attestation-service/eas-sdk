import { ZERO_ADDRESS } from '../utils';
import { utils } from 'ethers';
const { getAddress, verifyTypedData, hexlify, joinSignature, splitSignature, keccak256, toUtf8Bytes, defaultAbiCoder } = utils;
export const EIP712_DOMAIN = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
export class TypedDataHandler {
    config;
    constructor(config) {
        this.config = config;
    }
    getDomainSeparator() {
        return keccak256(defaultAbiCoder.encode(['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'], [
            keccak256(toUtf8Bytes(EIP712_DOMAIN)),
            keccak256(toUtf8Bytes(this.config.name)),
            keccak256(toUtf8Bytes(this.config.version)),
            this.config.chainId,
            this.config.address
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
        const rawSignature = await signer._signTypedData(types.domain, types.types, params);
        const signature = splitSignature(rawSignature);
        return { ...types, signature: { v: signature.v, r: signature.r, s: signature.s } };
    }
    verifyTypedDataRequestSignature(attester, request) {
        if (attester === ZERO_ADDRESS) {
            throw new Error('Invalid address');
        }
        const { signature } = request;
        const sig = joinSignature({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) });
        const recoveredAddress = verifyTypedData(request.domain, request.types, request.message, sig);
        return getAddress(attester) === getAddress(recoveredAddress);
    }
}
//# sourceMappingURL=typed-data-handler.js.map