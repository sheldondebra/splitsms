# @splitsms/sdk

Official SplitSMS JavaScript / Node.js SDK.

```bash
npm install @splitsms/sdk
```

```ts
import { SplitSMS } from "@splitsms/sdk";

const sms = new SplitSMS({
  apiKey: process.env.SPLITSMS_API_KEY,
  baseUrl: "https://www.splitsms.com", // optional
});

await sms.messages.send({
  sender: "MYBRAND",
  recipients: ["233201234567"],
  message: "Hello from SplitSMS",
});

await sms.otp.send("233201234567");
await sms.wallet.balance();
```

## Development

```bash
npm run build
```
