import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";
import { decode as base64ToBytes, encode as bytesToBase64 } from "@stablelib/base64";
import { encode as utf8ToBytes } from "@stablelib/utf8";
import { encode as bytesToHex } from "@stablelib/hex";
import nacl from "tweetnacl";
import { Client, decodeAccountID, Wallet } from "xrpl";

const NODE_URL = "https://nodes.staging.idos.network";

// TODO replace with your own
const consumerWallet = Wallet.fromSeed("sConsumer...");

const consumer = {
  // TODO replace with your own
  signingKeyPair: nacl.sign.keyPair.fromSecretKey(base64ToBytes("64 bytes in base64")),
  // TODO replace with your own
  encryptionKeyPair: nacl.box.keyPair.fromSecretKey(base64ToBytes("32 bytes in base 64")),
  address: consumerWallet.address,
};

// TODO paste from issuer frontend
const issuerAddress = "rIssuer...";
const userAddress = "rUser...";
// TODO paste from consumer frontend
const credentialId = "...uuid...";

const idosCredentialRetrieve = async () => {
  const idOSConsumer = await idOSConsumerClass.init({
    nodeUrl: NODE_URL,
    consumerSigner: consumerWallet,
    recipientEncryptionPrivateKey: bytesToBase64(consumer.encryptionKeyPair.secretKey),
  });

  const credentialContents = await idOSConsumer.getSharedCredentialContentDecrypted(credentialId);
  console.log(credentialContents);
};

const xrplCredentialCreate = async () => {
  const rpcClient = new Client("wss://s.altnet.rippletest.net:51233/");

  await rpcClient.connect();

  const credentialType = bytesToHex(Buffer.concat([
    utf8ToBytes("AG"),
    utf8ToBytes("-"),
    // TODO change this to avoid teDUPLICATES
    utf8ToBytes("KYC5"),
    utf8ToBytes("-"),
    // !!! don't use hyphens
    decodeAccountID(issuerAddress),
    utf8ToBytes("-"),
    utf8ToBytes("5Y"),
  ]));

  const res = await rpcClient.submitAndWait({
      TransactionType: "CredentialCreate",
      Account: consumer.address,
      Subject: userAddress,
      CredentialType: credentialType,
      URI: bytesToHex(Buffer.from(credentialId)),
    }, { wallet: consumerWallet },
  );

  console.log(res);

  await rpcClient.disconnect();
};

// TODO uncomment the operation you want to test
//await xrplCredentialCreate();
//await idosCredentialRetrieve();
