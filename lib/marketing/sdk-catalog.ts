import type { LucideIcon } from "lucide-react";
import { Code2, Smartphone, Terminal } from "lucide-react";
import type { sdkPackages } from "@/lib/site-config";

export type SdkCatalogEntry = {
  id: "javascript" | "php" | "flutter";
  icon: LucideIcon;
  name: string;
  tagline: string;
  packageName: string;
  version: string;
  /** One-line install developers can copy */
  primaryInstall: string;
  installSteps: { title: string; commands: string[] }[];
  envVars: { name: string; desc: string }[];
  example: string;
  methods: string[];
  notes?: string[];
};

export function buildSdkCatalog(
  baseUrl: string,
  packages: typeof sdkPackages,
): SdkCatalogEntry[] {
  const js = packages.javascript;
  const php = packages.php;
  const flutter = packages.flutter;

  return [
    {
      id: "javascript",
      icon: Terminal,
      name: "JavaScript / TypeScript",
      tagline: "Node.js 18+, Bun, Deno, and modern browsers with native fetch.",
      packageName: js.packageName,
      version: js.version,
      primaryInstall: `npm install ${baseUrl}/sdk/javascript/splitsms-sdk.tgz`,
      installSteps: [
        {
          title: "Install from SplitSMS (recommended)",
          commands: [
            `npm install ${baseUrl}/sdk/javascript/splitsms-sdk.tgz`,
            `# or pin a version:`,
            `npm install ${baseUrl}/sdk/javascript/splitsms-sdk-${js.version}.tgz`,
          ],
        },
        {
          title: "Add to package.json",
          commands: [
            `"dependencies": {`,
            `  "${js.packageName}": "${baseUrl}/sdk/javascript/splitsms-sdk.tgz"`,
            `}`,
          ],
        },
        {
          title: "Local / offline install",
          commands: [
            `# Download the .tgz from ${baseUrl}/sdk/javascript/`,
            `npm install ./vendor/splitsms-sdk.tgz`,
          ],
        },
      ],
      envVars: [
        { name: "SPLITSMS_API_KEY", desc: "Live (sk_live_…) or sandbox (sk_test_…) key" },
        { name: "SPLITSMS_BASE_URL", desc: `Optional — defaults to ${baseUrl}` },
      ],
      example: `import { SplitSMS } from "@splitsms/sdk";

const client = new SplitSMS({
  apiKey: process.env.SPLITSMS_API_KEY!,
  baseUrl: "${baseUrl}",
});

// Send SMS
await client.messages.send({
  sender: "MYBRAND",
  recipients: ["233201234567"],
  message: "Hello from SplitSMS",
});

// OTP
await client.otp.send("233201234567", "GH");
await client.otp.verify("233201234567", "123456");

// Wallet
const balance = await client.wallet.accountBalance();

// Connect — provision embedded customer
await client.connect.createCustomer({
  full_name: "Jane Doe",
  phone: "233201234567",
  country_code: "GH",
  external_ref: "crm-user-42",
  initial_sms_credits: 25,
});`,
      methods: [
        "messages.send · messages.get · messages.reports",
        "otp.send · otp.verify",
        "wallet.balance · wallet.accountBalance · wallet.transactions",
        "campaigns.list · campaigns.get",
        "connect.listCustomers · connect.createCustomer · connect.getCustomer",
        "senderIds.list · senderIds.register · senderIds.get",
      ],
      notes: [
        "Packages are hosted on splitsms.com — no npm publish required.",
        "Use sk_test_ keys for sandbox (validates but does not send live SMS).",
      ],
    },
    {
      id: "php",
      icon: Code2,
      name: "PHP",
      tagline: "WordPress, Laravel, and plain PHP — requires ext-curl and PHP 7.4+.",
      packageName: php.packageName,
      version: php.version,
      primaryInstall: `composer require ${php.packageName}`,
      installSteps: [
        {
          title: "Composer repository (one-time per project)",
          commands: [
            `composer config repositories.splitsms composer ${baseUrl}/sdk/php/`,
            `composer require ${php.packageName}:^${php.version.split(".")[0]}.${php.version.split(".")[1]}`,
          ],
        },
        {
          title: "Manual zip install",
          commands: [
            `# Download ${baseUrl}/sdk/php/splitsms-sdk.zip`,
            `# Extract to vendor/splitsms/sdk and add PSR-4 autoload, or use path repository:`,
            `composer config repositories.splitsms path ./vendor/splitsms-sdk`,
            `composer require ${php.packageName}:@dev`,
          ],
        },
      ],
      envVars: [
        { name: "SPLITSMS_API_KEY", desc: "Bearer token for all requests" },
      ],
      example: `<?php
require 'vendor/autoload.php';

use SplitSMS\\Client;

$client = new Client(getenv('SPLITSMS_API_KEY'), '${baseUrl}');

$client->sms()->send([
    'sender' => 'MYBRAND',
    'recipients' => ['233201234567'],
    'message' => 'Hello from SplitSMS',
]);

$client->otp()->send('233201234567', 'GH');
$client->wallet()->balance();

$client->connect()->createCustomer([
    'full_name' => 'Jane Doe',
    'phone' => '233201234567',
    'country_code' => 'GH',
    'external_ref' => 'wp-user-99',
]);`,
      methods: [
        "sms()->send · sms()->get",
        "otp()->send · otp()->verify",
        "wallet()->balance · wallet()->transactions",
        "connect()->listCustomers · connect()->createCustomer · connect()->getCustomer",
        "senderIds()->list · senderIds()->register · senderIds()->get",
      ],
      notes: [
        `Composer packages.json is served at ${baseUrl}/sdk/php/packages.json`,
        "Same REST surface as the WordPress plugin.",
      ],
    },
    {
      id: "flutter",
      icon: Smartphone,
      name: "Flutter / Dart",
      tagline: "Mobile and desktop Dart apps using the http package.",
      packageName: flutter.packageName,
      version: flutter.version,
      primaryInstall: "path: packages/splitsms_flutter",
      installSteps: [
        {
          title: "Download and add path dependency",
          commands: [
            `# 1. Download ${baseUrl}/sdk/flutter/splitsms-flutter.zip`,
            `# 2. Extract to your project: packages/splitsms_flutter/`,
            `# 3. In pubspec.yaml:`,
            `dependencies:`,
            `  ${flutter.packageName}:`,
            `    path: packages/splitsms_flutter`,
            `# 4. Run: flutter pub get`,
          ],
        },
        {
          title: "Monorepo / git submodule",
          commands: [
            `# Copy sdk/flutter from the SplitSMS repo into packages/splitsms_flutter`,
            `flutter pub get`,
          ],
        },
      ],
      envVars: [
        { name: "API key", desc: "Pass to SplitSMS(apiKey: ...) — use flutter_dotenv in production" },
      ],
      example: `import 'package:splitsms_flutter/splitsms.dart';

final sms = SplitSMS(
  apiKey: apiKey,
  baseUrl: '${baseUrl}',
);

await sms.sendMessage(
  sender: 'MYBRAND',
  recipients: ['233201234567'],
  message: 'Hello from SplitSMS',
);

await sms.sendOtp('233201234567');
await sms.verifyOtp('233201234567', '123456');
await sms.accountBalance();

await sms.createConnectCustomer({
  'full_name': 'Jane Doe',
  'phone': '233201234567',
  'country_code': 'GH',
  'external_ref': 'app-user-1',
});`,
      methods: [
        "sendMessage · sendOtp · verifyOtp",
        "walletBalance · accountBalance",
        "listConnectCustomers · createConnectCustomer",
        "listSenderIds · registerSenderId",
      ],
      notes: [
        "Flutter package is distributed as a zip from SplitSMS (pub.dev optional later).",
        "Call close() when disposing the client to free the HTTP connection.",
      ],
    },
  ];
}

export const sdkFeatureList = [
  "Send SMS & bulk recipients",
  "OTP send & verify",
  "Wallet & account balance",
  "Delivery reports",
  "Connect customer provisioning",
  "Sender ID registration",
  "Automatic retries (JS)",
  "Typed errors",
];
