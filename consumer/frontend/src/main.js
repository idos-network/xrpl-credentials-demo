import { createIDOSClient } from "@idos-network/client";
import { Xumm } from "xumm";
import * as nacl from "tweetnacl";
import { decode as base64ToBytes, encode as bytesToBase64 } from "@stablelib/base64";
import { encode as bytesToHex } from "@stablelib/hex";
import { encode as utf8ToBytes } from "@stablelib/utf8";
import { decodeAccountID } from "xrpl";
import { Wallet } from "xrpl";

const NODE_URL = "https://nodes.staging.idos.network";

// TODO replace with your own
const consumerWallet = Wallet.fromSeed("sConsumer...");

const consumer = {
  // TODO replace with your own
  signingKeyPair: nacl.sign.keyPair.fromSecretKey(base64ToBytes("64 bytes in base64")),
  address: consumerWallet.address,
  // TODO replace with your own
  encryptionKeyPair: nacl.box.keyPair.fromSecretKey(base64ToBytes("32 bytes in base64")),
};

const gemWallet = window.GemWalletApi;

let idOSClient = createIDOSClient({
  nodeUrl: NODE_URL,
  enclaveOptions: {
    container: "#idOS-enclave",
  },
});

idOSClient = await idOSClient.createClient()
idOSClient = await idOSClient.withUserSigner(gemWallet);
idOSClient = await idOSClient.logIn();

console.log(await idOSClient.getAllCredentials());

// TODO replace with your own
const issuerAddress = "rIssuer...";

document.querySelector("button#request-copy").addEventListener("click", async e => {
  await gemWallet.isInstalled();

  const { id: copyId } = await idOSClient.createCredentialCopy(
    // TODO replace with desired original ID
    "...uuid...",
    bytesToBase64(consumer.encryptionKeyPair.publicKey),
    consumer.address,
    "0",
  );

  console.log("Credential duplicate ID:");
  console.log(copyId);
});

document.querySelector("button#credential-accept").addEventListener("click", async e => {
  // TODO replace with your own
  const xumm = new Xumm("Xaman API Key")
  await xumm.authorize();

  const credentialType = bytesToHex(Buffer.concat([
    utf8ToBytes("AG"),
    utf8ToBytes("-"),
    // TODO change this to avoid teDUPLICATES
    // !!! don't use hyphens
    utf8ToBytes("KYC5"),
    utf8ToBytes("-"),
    decodeAccountID(issuerAddress),
    utf8ToBytes("-"),
    utf8ToBytes("5Y"),
  ]));

  xumm.payload.createAndSubscribe({
    TransactionType: "CredentialAccept",
    Issuer: consumer.address,
    Account: (await gemWallet.getAddress()).result.address,
    CredentialType: credentialType,
  }, eventMessage => {
    if ('opened' in eventMessage.data) {}
    if ('signed' in eventMessage.data) { return eventMessage }
  })
    .then(({ created, resolved }) => { return resolved; })
    .then(payload => console.log('Payload resolved', payload));
});
