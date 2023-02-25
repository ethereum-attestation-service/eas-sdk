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
import { BigNumberish } from 'ethers';
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

  public signAttestation(
    attester: TypedDataSigner,
    schema: string,
    recipient: string | SignerWithAddress,
    time: BigNumberish,
    expirationTime: BigNumberish,
    revocable: boolean,
    refUID: string,
    data: string,
    customUid?: string
  ): Promise<SignedOffchainAttestation> {
    return this.signCustomAttestation(
      {
        schema,
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        time,
        expirationTime,
        revocable,
        refUID,
        data
      },
      attester,
      customUid
    );
  }

  public verifyAttestation(attester: string, request: SignedOffchainAttestation): boolean {
    return this.verifyOffchainAttestationSignature(attester, request);
  }

  private async signCustomAttestation(
    params: OffchainAttestationParams,
    signer: TypedDataSigner,
    customUid?: string
  ): Promise<SignedOffchainAttestation> {
    const uid = customUid ?? OffchainUtils.getOffchainUID(params);

    const signedRequest = await this.signTypedDataRequest<EIP712MessageTypes, OffchainAttestationParams>(
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
    );

    return {
      ...signedRequest,
      uid
    };
  }
}
