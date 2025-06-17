"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyVersion = void 0;
const ethers_1 = require("ethers");
const VERSION_ABI = [
    {
        inputs: [],
        name: 'VERSION',
        outputs: [
            {
                internalType: 'string',
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const legacyVersion = async (contract) => {
    const provider = contract.runner?.provider;
    if (!provider) {
        throw new Error("provider wasn't set");
    }
    const legacyContract = new ethers_1.BaseContract(await contract.getAddress(), VERSION_ABI, provider);
    try {
        return await legacyContract.getFunction('VERSION').staticCall();
    }
    catch {
        return undefined;
    }
};
exports.legacyVersion = legacyVersion;
//# sourceMappingURL=version.js.map