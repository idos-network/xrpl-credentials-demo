import { idOSIssuer as idOSIssuerClass } from "@idos-network/issuer";
import { decode as base64ToBytes } from "@stablelib/base64";
import { encode as utf8ToBytes } from "@stablelib/utf8";
import { encode as bytesToHex } from "@stablelib/hex";
import nacl from "tweetnacl";
import { Client, Wallet } from "xrpl";

const NODE_URL = "https://nodes.staging.idos.network";

// TODO replace with your own
const issuerWallet = Wallet.fromSeed("sIssuer...");

const issuer = {
  // TODO replace with your own
  signingKeyPair: nacl.sign.keyPair.fromSecretKey(base64ToBytes("64 bytes in base64")),
  // TODO replace with your own
  encryptionSecretKey: base64ToBytes("32 bytes in base64"),
  address: issuerWallet.address,
  multibaseSigningKeyPair: {
    privateKey: "zrv4pMmRRcDjmh5K1Trg8Gq9kCZPs17RdA2XVDpHFNYKFxo9YWNc8aExeViL2J41PTv39ayTjGkf4JT4dcRwBPU2PEK",
    publicKey: "z6MkgZVY2WUNrRTDtww72aHLQSAcgZ4EtZfWrJiTsXMqG4Bm",
  },
};

const idOSIssuer = await idOSIssuerClass.init({
  nodeUrl: NODE_URL,
  signingKeyPair: issuer.signingKeyPair,
  encryptionSecretKey: issuer.encryptionSecretKey,
});

const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";
const issuer__ = "https://vc-issuers.cool.id/idos";

const credentialFields = {
  id: `${issuer__}/credentials/${id}`,
  level: "human",
  issued: new Date(),
  approvedAt: new Date(),
};

const credentialSubject = {
  id: `uuid:${id}`,
  firstName: "John",
  familyName: "Doe",
};

const issuer_ = {
  id: `${issuer__}/keys/1`,
  controller: `${issuer__}/issuers/1`,
  publicKeyMultibase: issuer.multibaseSigningKeyPair.publicKey,
  privateKeyMultibase: issuer.multibaseSigningKeyPair.privateKey,
};

const credential = await idOSIssuer.buildCredentials(
  credentialFields,
  credentialSubject,
  issuer_,
  false,
);

const publicNotesId = crypto.randomUUID();

const credentialsPublicNotes = {
  id: publicNotesId,
  type: "human",
  level: "human",
  status: "approved",
  issuer: "MyIssuer",
};

const credentialContent = JSON.stringify(credential);

const credentialPayload = {
  // TODO paste from frontend
  user_id: "...uuid...",
  recipientEncryptionPublicKey: base64ToBytes("...base64..."),

  plaintextContent: utf8ToBytes(credentialContent),
  publicNotes: JSON.stringify(credentialsPublicNotes),
};

// TODO paste from frontend
const delegatedWriteGrant = { /* ... */ };

const r = await idOSIssuer.createCredentialByDelegatedWriteGrant(
  credentialPayload,
  {
    id: delegatedWriteGrant.id,
    ownerWalletIdentifier: delegatedWriteGrant.owner_wallet_identifier,
    consumerWalletIdentifier: delegatedWriteGrant.grantee_wallet_identifier,
    issuerPublicKey: delegatedWriteGrant.issuer_public_key.toLowerCase(),
    accessGrantTimelock: delegatedWriteGrant.access_grant_timelock,
    notUsableBefore: delegatedWriteGrant.not_usable_before,
    notUsableAfter: delegatedWriteGrant.not_usable_after,
    // TODO paste from frontend
    signature: "...hex...",
  }
);

const credentialId = r.originalCredential.id;
console.log("original ID:", r.originalCredential.id);

const rpcClient = new Client("wss://s.altnet.rippletest.net:51233/");
await rpcClient.connect();

const res = await rpcClient.submitAndWait(
  {
    TransactionType: "CredentialCreate",
    Account: issuerWallet.address,
    Subject: delegatedWriteGrant.owner_wallet_identifier,
    // TODO change this to avoid teDUPLICATES
    // !!! don't use hyphens
    CredentialType: bytesToHex(utf8ToBytes("KYC5")),
    URI: bytesToHex(Buffer.from(credentialId)),
  },
  { wallet: issuerWallet },
);

console.log(res);

await rpcClient.disconnect();
