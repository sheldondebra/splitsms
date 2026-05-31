# @splitsms/sdk

Official SplitSMS JavaScript / TypeScript SDK.

## Install from SplitSMS (recommended)

**Do not run** `npm install @splitsms/sdk` — that package is not on registry.npmjs.org (404).

Packages are hosted on [splitsms.com](https://www.splitsms.com/sdk):

```bash
npm install https://www.splitsms.com/sdk/javascript/splitsms-sdk.tgz
```

Or pin a version:

```bash
npm install https://www.splitsms.com/sdk/javascript/splitsms-sdk-1.1.0.tgz
```

Add to `package.json`:

```json
"dependencies": {
  "@splitsms/sdk": "https://www.splitsms.com/sdk/javascript/splitsms-sdk.tgz"
}
```

## Usage

```ts
import { SplitSMS } from "@splitsms/sdk";

const client = new SplitSMS({
  apiKey: process.env.SPLITSMS_API_KEY!,
  baseUrl: "https://www.splitsms.com",
});

await client.messages.send({
  sender: "MYBRAND",
  recipients: ["233201234567"],
  message: "Hello from SplitSMS",
});

await client.otp.send("233201234567");
await client.wallet.accountBalance();
await client.connect.createCustomer({
  full_name: "Jane Doe",
  phone: "233201234567",
  country_code: "GH",
  external_ref: "user-42",
});
```

## Development

```bash
npm run build
```

Publish artifacts: `npm run sync:sdks` from the repo root.
