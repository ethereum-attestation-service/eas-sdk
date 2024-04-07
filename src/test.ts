import { encodeBytes32String, ethers } from 'ethers';
import { EAS, NO_EXPIRATION, SchemaEncoder, ZERO_BYTES32 } from './';

const url = 'https://sepolia.optimism.io';

// Set up your ethers provider and signer
const provider = new ethers.JsonRpcProvider(url, undefined, {
  staticNetwork: true
});
const attesterPrivateKey = '0x78980761ee12352fd1d989f71832039240018a054ea003f94674f78ade6f57a1';
const payerPrivateKey = '0x5baf32bcc74557018b6c3d960925994103cdd99da17583ee04e20da88e473f3b';
const EASContractAddress = '0x4200000000000000000000000000000000000021';

const attesterEAS = new EAS(EASContractAddress);
const attesterWallet = new ethers.Wallet(attesterPrivateKey, provider);
attesterEAS.connect(attesterWallet);

const payerEas = new EAS(EASContractAddress);
const payerWallet = new ethers.Wallet(payerPrivateKey, provider);
payerEas.connect(payerWallet);

async function go() {
  console.log('version', await payerEas.getVersion());
  console.log('domainSeparator', await payerEas.getDomainSeparator());

  const { recipient, meetingId, meetingType, startTime, endTime } = {
    recipient: ethers.Wallet.createRandom().address,
    meetingId: 'meetingId',
    meetingType: 1,
    startTime: 1630000000,
    endTime: 1630000000
  };

  try {
    const schemaEncoder = new SchemaEncoder('bytes32 MeetingId,uint8 MeetingType,uint32 StartTime,uint32 EndTime');

    const encodedData = schemaEncoder.encodeData([
      {
        name: 'MeetingId',
        value: encodeBytes32String(meetingId),
        type: 'bytes32'
      },
      { name: 'MeetingType', value: meetingType, type: 'uint8' },
      { name: 'StartTime', value: startTime, type: 'uint32' },
      { name: 'EndTime', value: endTime, type: 'uint32' }
    ]);
    const schemaUID = '0x05c93054d8326438fe4f859f9382540f37677a5c87020037b9ec9554b3daff0f';

    try {
      const delegated = await attesterEAS.getDelegated();

      console.log('delegated obj', delegated);
      console.log('delegated domain separator', delegated.getDomainSeparator());
      console.log('delegated domain data', delegated.getDomainTypedData());

      const delegatedAttestation = await delegated.signDelegatedAttestation(
        {
          schema: schemaUID,
          recipient: recipient,
          expirationTime: NO_EXPIRATION,
          revocable: false,
          refUID: ZERO_BYTES32,
          data: encodedData,
          value: BigInt(0),
          deadline: BigInt(Math.round(Date.now() / 1000) + 60 * 60 * 24),
          nonce: await attesterEAS.getNonce(attesterWallet.address)
        },
        attesterWallet
      );

      console.log('delegatedAttestation', delegatedAttestation);
      console.log('verifying...');
      const verify = await delegated.verifyDelegatedAttestationSignature(
        await attesterWallet.getAddress(),
        delegatedAttestation
      );
      console.log('verify obj', verify);
      console.log('attesterWallet.address', attesterWallet.address);

      const tx = await payerEas.attestByDelegation({
        schema: schemaUID,
        data: {
          recipient: delegatedAttestation.message.recipient,
          expirationTime: delegatedAttestation.message.expirationTime,
          revocable: delegatedAttestation.message.revocable,
          refUID: delegatedAttestation.message.refUID,
          data: encodedData,
          value: delegatedAttestation.message.value
        },
        signature: delegatedAttestation.signature,
        attester: attesterWallet.address,
        deadline: delegatedAttestation.message.deadline
      });
      const newAttestationUID = await tx.wait();
      console.log('New attestation UID:', newAttestationUID);
    } catch (error) {
      console.error('Error:', error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

go();
