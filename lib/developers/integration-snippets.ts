export type IntegrationStack =
  | "nextjs-sms"
  | "nextjs-otp"
  | "express-sms"
  | "express-otp"
  | "node-sdk"
  | "curl"
  | "webhook-nextjs";

export type IntegrationStackMeta = {
  id: IntegrationStack;
  name: string;
  description: string;
  tags: string[];
};

export const integrationStacks: IntegrationStackMeta[] = [
  {
    id: "nextjs-sms",
    name: "Next.js — Send SMS",
    description: "App Router route handler that sends SMS via fetch.",
    tags: ["Next.js", "App Router", "SMS"],
  },
  {
    id: "nextjs-otp",
    name: "Next.js — OTP login",
    description: "Send + verify OTP API routes with sandbox support.",
    tags: ["Next.js", "OTP", "Auth"],
  },
  {
    id: "express-sms",
    name: "Express — Send SMS",
    description: "Minimal Express POST /sms endpoint.",
    tags: ["Express", "Node", "SMS"],
  },
  {
    id: "express-otp",
    name: "Express — OTP",
    description: "Express routes for OTP send and verify.",
    tags: ["Express", "OTP"],
  },
  {
    id: "node-sdk",
    name: "JavaScript SDK",
    description: "Official @splitsms/sdk client (install from hosted tarball).",
    tags: ["SDK", "TypeScript"],
  },
  {
    id: "curl",
    name: "cURL",
    description: "Copy-paste terminal commands — no dependencies.",
    tags: ["cURL", "Quick test"],
  },
  {
    id: "webhook-nextjs",
    name: "Next.js — Webhook verify",
    description: "Verify X-SplitSMS-Signature on delivery webhooks.",
    tags: ["Webhooks", "Next.js"],
  },
];

export function buildEnvSnippet(baseUrl: string): string {
  return `# SplitSMS — add to .env.local
SPLITSMS_API_KEY=sk_test_your_sandbox_key_here
SPLITSMS_BASE_URL=${baseUrl}`;
}

export function buildIntegrationCode(
  stack: IntegrationStack,
  baseUrl: string,
  apiV1: string,
): { filename?: string; code: string } {
  switch (stack) {
    case "nextjs-sms":
      return {
        filename: "app/api/sms/send/route.ts",
        code: `import { NextResponse } from "next/server";

const API = process.env.SPLITSMS_BASE_URL ?? "${baseUrl}";
const KEY = process.env.SPLITSMS_API_KEY!;

export async function POST(req: Request) {
  const { to, message, sender = "MYBRAND" } = await req.json();

  const res = await fetch(\`\${API}/api/v1/sms/send\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender,
      recipients: [to],
      message,
      countryCode: "GH",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}`,
      };

    case "nextjs-otp":
      return {
        filename: "app/api/otp/send/route.ts + verify/route.ts",
        code: `// app/api/otp/send/route.ts
import { NextResponse } from "next/server";

const API = process.env.SPLITSMS_BASE_URL ?? "${baseUrl}";
const KEY = process.env.SPLITSMS_API_KEY!;

export async function POST(req: Request) {
  const { phone } = await req.json();
  const res = await fetch(\`\${API}/api/v1/otp/send\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, countryCode: "GH" }),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

// app/api/otp/verify/route.ts
export async function POST(req: Request) {
  const { phone, code } = await req.json();
  const res = await fetch(\`\${API}/api/v1/otp/verify\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, code }),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

// Sandbox: use code 123456 with sk_test_ keys`,
      };

    case "express-sms":
      return {
        filename: "server.js",
        code: `import express from "express";

const app = express();
app.use(express.json());

const API = process.env.SPLITSMS_BASE_URL ?? "${baseUrl}";
const KEY = process.env.SPLITSMS_API_KEY;

app.post("/sms", async (req, res) => {
  const { to, message, sender = "MYBRAND" } = req.body;
  const r = await fetch(\`\${API}/api/v1/sms/send\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender,
      recipients: [to],
      message,
      countryCode: "GH",
    }),
  });
  res.status(r.status).json(await r.json());
});

app.listen(3001, () => console.log("http://localhost:3001"));`,
      };

    case "express-otp":
      return {
        filename: "server.js",
        code: `import express from "express";

const app = express();
app.use(express.json());

const API = process.env.SPLITSMS_BASE_URL ?? "${baseUrl}";
const KEY = process.env.SPLITSMS_API_KEY;

app.post("/otp/send", async (req, res) => {
  const r = await fetch(\`\${API}/api/v1/otp/send\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...req.body, countryCode: "GH" }),
  });
  res.status(r.status).json(await r.json());
});

app.post("/otp/verify", async (req, res) => {
  const r = await fetch(\`\${API}/api/v1/otp/verify\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json());
});

// Sandbox verify code: 123456`,
      };

    case "node-sdk":
      return {
        filename: "send-sms.ts",
        code: `// Install: npm install ${baseUrl}/sdk/javascript/splitsms-sdk.tgz
import { SplitSMS } from "@splitsms/sdk";

const client = new SplitSMS({
  apiKey: process.env.SPLITSMS_API_KEY!,
  baseUrl: process.env.SPLITSMS_BASE_URL ?? "${baseUrl}",
});

export async function sendWelcomeSms(phone: string) {
  return client.messages.send({
    sender: "MYBRAND",
    recipients: [phone],
    message: "Welcome to our app!",
  });
}

export async function sendAndVerifyOtp(phone: string, code: string) {
  await client.otp.send(phone, "GH");
  return client.otp.verify(phone, code);
}`,
      };

    case "curl":
      return {
        code: `# Balance
curl -s "${apiV1}/balance" \\
  -H "Authorization: Bearer $SPLITSMS_API_KEY"

# Send SMS
curl -s -X POST "${apiV1}/sms/send" \\
  -H "Authorization: Bearer $SPLITSMS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"sender":"MYBRAND","recipients":["233201234567"],"message":"Hello","countryCode":"GH"}'

# OTP send + verify (sandbox code: 123456)
curl -s -X POST "${apiV1}/otp/send" \\
  -H "Authorization: Bearer $SPLITSMS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"233201234567","countryCode":"GH"}'

curl -s -X POST "${apiV1}/otp/verify" \\
  -H "Authorization: Bearer $SPLITSMS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"233201234567","code":"123456"}'`,
      };

    case "webhook-nextjs":
      return {
        filename: "app/api/webhooks/splitsms/route.ts",
        code: `import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const SECRET = process.env.SPLITSMS_WEBHOOK_SECRET!;

function verifySignature(rawBody: string, signature: string | null) {
  if (!signature || !SECRET) return false;
  const expected = createHmac("sha256", SECRET).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("X-SplitSMS-Signature");

  if (!verifySignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  // event.event: message.delivered | message.failed | campaign.completed | ...
  console.log("SplitSMS webhook:", event.event, event.data);

  return NextResponse.json({ received: true });
}`,
      };
  }
}

export function buildSdkInstallCommand(baseUrl: string): string {
  return `npm install ${baseUrl}/sdk/javascript/splitsms-sdk.tgz`;
}
