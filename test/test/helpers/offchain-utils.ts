import {
  ATTESTATION_PRIMARY_TYPE,
  ATTESTATION_TYPE,
  EIP712MessageTypes,
  Offchain,
  OffchainAttestationParams,
  SignedOffchainAttestation,
  TypedDataSigner
} from '../../../src/offchain/offchain';
import { HARDHAT_CHAIN_ID } from '../../utils/Constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export class OffchainUtils extends Offchain {
  public constructor(contract: string | SignerWithAddress) {
    const contractAddress = typeof contract === 'string' ? contract : contract.address;

    const config = {
      address: contractAddress,
      version: '0.19',
      chainId: HARDHAT_CHAIN_ID
    };

    super(config);
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
