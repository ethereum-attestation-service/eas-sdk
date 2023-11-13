import { EAS } from '../../../src/eas';
import { Offchain, OffchainAttestationType, OffChainAttestationVersion, TypedDataConfig } from '../../../src/offchain';

interface CustomOffchainParams {
  version: string;
  type?: OffchainAttestationType;
}

export class CustomOffchain extends Offchain {
  constructor(config: TypedDataConfig, params: CustomOffchainParams, eas: EAS) {
    super(config, OffChainAttestationVersion.Version1, eas);

    const { version, type } = params;

    this.config = { ...this.config, version };

    if (type) {
      this.type = type;
    }
  }
}
