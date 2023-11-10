import { EAS } from '../../../src/eas';
import { Offchain, OffChainAttestationVersion, TypedDataConfig } from '../../../src/offchain';

interface CustomDomain {
  name: string;
  version: string;
}

export class CustomOffchain extends Offchain {
  constructor(config: TypedDataConfig, domain: CustomDomain, eas: EAS) {
    super(config, OffChainAttestationVersion.Version1, eas);

    this.config = { ...this.config, ...domain };
  }
}
