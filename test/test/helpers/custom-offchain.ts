import { EAS } from '../../../src/eas';
import { Offchain, OffChainAttestationVersion, TypedDataConfig } from '../../../src/offchain';

export class CustomOffchain extends Offchain {
  constructor(config: TypedDataConfig, version: string, eas: EAS) {
    super(config, OffChainAttestationVersion.Version1, eas);

    this.config = { ...this.config, version };
  }
}
