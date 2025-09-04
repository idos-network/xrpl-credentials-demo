# xrpl-credentials-demo

This repo demonstrates how the idOS/XRPL integration works. It operates on the XRPL Testnet.

We have [idOS SDK XRPL helpers](https://github.com/idos-network/idos-sdk-js/blob/main/docs/guide-xrpl-credentials.md) for `CredentialCreate` and `CredentialAccept` transactions, but skipped them here in order to make the code more understandable and explicit.

### Set up 3 funded wallets

One for each demo role: the User, the Issuer, and the Consumer. An easy way to fund these is with the [XRP Faucet](https://xrpl.org/resources/dev-tools/xrp-faucets).

Make sure your User wallet is imported into Gem Wallet, and also to Xaman — Gem doesn't support `CredentialCreate` or `CredentialAccept` transaction payloads at the moment (issue [filed here](https://github.com/GemWallet/gemwallet-extension/issues/424)).

Also ensure both Gem and Wallet are targeting Testnet.

### Make sure your User wallet has an idOS profile

One way to do this is to go to https://consumer-and-issuer-demo.staging.idos.network/ and connect your User wallet.

You don't need to proceed after seeing "profile created": once you see "Verify your identity" you can stop.

### Running the demo

First, clone this repo and install all dependencies:

```bash
$ cd issuer/frontend
$ pnpm i

$ cd issuer/backend
$ pnpm i

$ cd consumer/frontend
$ pnpm i

$ cd consumer/backend
$ pnpm i
```

Then, start each of the frontend servers:

```bash
cd issuer/frontend
npx vite

cd consumer/frontend
npx vite
```

### Experiencing the user flow

We'll start with Credential issuance. Suppose you visited an Issuer (e.g. an IDV service) and provided the requested data for verification. The Issuer now asks you for a delegated write grant — a signature that authorizes them to create an idOS Credential on your behalf into your idOS profile. To do this, open `issuer/frontend/src/main.js` and follow the TODOs. Visit the issuer frontend and click `[Request dWG]`.

Open `issuer/backend/src/main.js` and follow the TODOs. Some of it you'll have to copy from the browser's JavaScript console. Congratulations, you just sent data to the "backend" and can now run it:

```bash
$ cd issuer/backend
$ node src/main.js
original ID: 45655b6e-23cf-4781-a46b-02f67a31ae73
{
  api_version: 2,
  id: 10,
  result: {
    close_time_iso: '2025-09-04T15:47:00Z',
    ctid: 'C09DCCAB00000001',
...
```

That "original ID" is the ID of the idOS Credential just inserted. Additionally, an XRPL Credential was created with a reference to the idOS Credential.

You can now go back to the Issuer frontend, click `[CredentialAccept]`, and use Xaman to send that transaction. Now you're all set: you have an idOS Credential created by the Issuer, and there's an XRPL Credential referencing it. You're ready for the next stage.

Open `consumer/frontend/src/main.js`, follow the TODOs, and visit the Consumer frontend. This would be a dapp that requires KYC to operate. Click `[Request copy]` to use the idOS SDK to create a re-encrypted duplicate of the original idOS Credential created before.

Copy the console output and follow the TODOs in `consumer/backend/src/main.js`. Uncomment `await xrplCredentialCreate()` and run the "backend":

```bash
$ cd consumer/backend
$ node src/main.js
{
  api_version: 2,
  id: 12,
  result: {
    close_time_iso: '2025-09-04T15:48:40Z',
    ctid: 'C09DCCCC00000001',
...
```

You can now go back to the Consumer frontend and accept this new XRPL Credential by clicking `[CredentialAccept]`. And that's it! Within 60 seconds or so, you can instead uncomment `await idosCredentialRetrieve()` and run the "backend" again, which should show you the idOS Credential:
```bash
$ cd consumer/backend
$ node src/main.js
{"@context":["https://www.w3.org/2018/credentials/v1"
...
```


Request dWG
copy object and signature
Follow the TODOs in issuer/backend/src/main.js to add the Issuer seed and keys in order to paste object and signature, also user ID etc

