import {
  ATTESTATION_PRIMARY_TYPE,
  ATTESTATION_TYPE,
  EIP712MessageTypes,
  Offchain,
  OffchainAttestationParams,
  SignedOffchainAttestation,
  TypedDataConfig,
  TypedDataSigner
} from '../../../src/offchain/offchain';
import { EAS } from '@ethereum-attestation-service/eas-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { network } from 'hardhat';

export class OffchainUtils extends Offchain {
  public constructor(config: TypedDataConfig) {
    super(config);
  }

  public static async fromVerifier(verifier: EAS) {
    const config = {
      address: verifier.address,
      version: await verifier.VERSION(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      chainId: network.config.chainId!
    };

    return new OffchainUtils(config);
  }

  public async signAttestation(
    attester: TypedDataSigner,
    schema: string,
    recipient: string | SignerWithAddress,
    time: number,
    expirationTime: number,
    revocable: boolean,
    refUUID: string,
    data: string,
    customUuid?: string
  ): Promise<SignedOffchainAttestation> {
    return this.signCustomAttestation(
      {
        schema,
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        time,
        expirationTime,
        revocable,
        refUUID,
        data
      },
      attester,
      customUuid
    );
  }

  public async verifyAttestation(attester: string, request: SignedOffchainAttestation): Promise<boolean> {
    return this.verifyOffchainAttestationSignature(attester, request);
  }

  private async signCustomAttestation(
    params: OffchainAttestationParams,
    signer: TypedDataSigner,
    customUuid?: string
  ): Promise<SignedOffchainAttestation> {
    const uuid = customUuid ?? OffchainUtils.getOffchainUUID(params);

    return {
      ...(await this.signTypedDataRequest<EIP712MessageTypes, OffchainAttestationParams>(
        params,
        {
          domain: this.getDomainTypedData(),
          primaryType: ATTESTATION_PRIMARY_TYPE,
          message: params,
          types: {
            Attest: ATTESTATION_TYPE
          }
        },
        signer
      )),
      uuid
    };
  }
}
