import { createIDOSClient } from "@idos-network/client";
import { encode as bytesToHex } from "@stablelib/hex";
import { decode as base64ToBytes } from "@stablelib/base64";
import { Xumm } from "xumm";
import nacl from "tweetnacl";
import { Wallet } from "xrpl";

const NODE_URL = "https://nodes.staging.idos.network";

// TODO replace with your own
const issuerWallet = Wallet.fromSeed("sIssuer...");

const issuer = {
  // TODO replace with your own
  signingPublicKey: bytesToHex(nacl.sign.keyPair.fromSecretKey(base64ToBytes("64 bytes in base64")).publicKey),
  address: issuerWallet.address,
};

const gemWallet = window.GemWalletApi;

let idOSClient = createIDOSClient({
  nodeUrl: NODE_URL,
  enclaveOptions: { container: "#idOS-enclave" },
});

idOSClient = await idOSClient.createClient()
idOSClient = await idOSClient.withUserSigner(gemWallet);
idOSClient = await idOSClient.logIn();

console.log("issuer address:");
console.log(issuerWallet.address);

console.log("user address:");
console.log((await gemWallet.getAddress()).result.address);

console.log("idOS user ID:");
console.log(idOSClient.user.id);

console.log("idOS user encryption public key:");
console.log(idOSClient.user.recipient_encryption_public_key);

document.querySelector("button#request-dwg").addEventListener("click", async e => {
  await gemWallet.isInstalled();

  const currentTimestamp = Date.now();
  const currentDate = new Date(currentTimestamp);
  const notUsableAfter = new Date(currentTimestamp + 24 * 60 * 60 * 1000);

  const delegatedWriteGrant = {
    owner_wallet_identifier: (await gemWallet.getAddress()).result.address,
    grantee_wallet_identifier: issuer.address,
    issuer_public_key: issuer.signingPublicKey,
    id: crypto.randomUUID(),
    access_grant_timelock: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
    not_usable_before: currentDate.toISOString().replace(/.\d+Z$/g, "Z"),
    not_usable_after: notUsableAfter.toISOString().replace(/.\d+Z$/g, "Z"),
  };
  console.log("delegated write grant:");
  console.log(delegatedWriteGrant);

  const message = await idOSClient.requestDWGMessage(delegatedWriteGrant);

  const signature = await gemWallet.signMessage(message);
  console.log("signature:");
  console.log(signature.result.signedMessage);
});

document.querySelector("button#credential-accept").addEventListener("click", async e => {
  // TODO replace with your own
  const xumm = new Xumm("Xaman API Key");

  await xumm.authorize();

  xumm.payload.createAndSubscribe({
    TransactionType: "CredentialAccept",
    Issuer: issuer.address,
    Account: (await gemWallet.getAddress()).result.address,
    // TODO change this to avoid teDUPLICATES
    // !!! don't use hyphens
    CredentialType: bytesToHex(Buffer.from("KYC5")),
  }, eventMessage => { if ("signed" in eventMessage.data) { return eventMessage } }
  ).then(({ created, resolved }) => { return resolved; });
});
