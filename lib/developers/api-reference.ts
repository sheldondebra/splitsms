export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type ApiEndpointDoc = {
  method: HttpMethod;
  path: string;
  title: string;
  description: string;
  permission: string;
  query?: string[];
  body?: string;
  response?: string;
};

export type ApiDocSection = {
  id: string;
  title: string;
  icon: string;
  description: string;
  endpoints: ApiEndpointDoc[];
};

export const API_BASE_HINT = "https://splitsms.com";

export const apiDocSections: ApiDocSection[] = [
  {
    id: "auth",
    title: "Authentication",
    icon: "shield",
    description: "All requests use Bearer token authentication with your API key.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/balance",
        title: "Account balance",
        description: "Wallet balance and SMS credits in one call.",
        permission: "wallet.read",
        response: `{
  "success": true,
  "wallet": { "balance": 120.5, "currency": "GHS" },
  "sms_credits": 450,
  "sandbox": false
}`,
      },
    ],
  },
  {
    id: "wallet",
    title: "Wallet",
    icon: "wallet",
    description: "Read wallet funds and transaction history.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/wallet/balance",
        title: "Wallet balance",
        description: "Alias of balance endpoint — returns wallet + SMS credits.",
        permission: "wallet.read",
        response: `{
  "success": true,
  "wallet": { "balance": 120.5, "currency": "GHS" },
  "sms_credits": 450
}`,
      },
      {
        method: "GET",
        path: "/api/v1/wallet/transactions",
        title: "Transactions",
        description: "List recent wallet and credit transactions.",
        permission: "wallet.read",
        query: ["limit (max 100)"],
        response: `{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "SMS_DEBIT",
      "amount": 2.5,
      "currency": "GHS",
      "credits": 1,
      "description": "Bulk send",
      "createdAt": "2026-05-21T10:00:00.000Z"
    }
  ]
}`,
      },
    ],
  },
  {
    id: "sms",
    title: "SMS",
    icon: "send",
    description: "Send messages and check delivery status.",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/sms/send",
        title: "Send SMS",
        description: "Send to one or many recipients. Deducts credits (live keys only).",
        permission: "sms.send",
        body: `{
  "sender": "MYBRAND",
  "message": "Hello from SplitSMS",
  "recipients": ["233201234567", "233501234567"],
  "countryCode": "GH"
}`,
        response: `{
  "success": true,
  "campaign_id": "...",
  "message_ids": ["..."],
  "queued": true,
  "recipients": 2
}`,
      },
      {
        method: "POST",
        path: "/api/v1/messages/send",
        title: "Send SMS (alias)",
        description: "Same as /api/v1/sms/send.",
        permission: "sms.send",
        body: `{ "from": "MYBRAND", "message": "Hi", "to": "233201234567" }`,
      },
      {
        method: "GET",
        path: "/api/v1/messages/{id}",
        title: "Message status",
        description: "Get delivery status for a single message.",
        permission: "sms.read",
        response: `{
  "success": true,
  "data": {
    "id": "...",
    "recipient": "233201234567",
    "status": "DELIVERED",
    "sent_at": "...",
    "delivered_at": "..."
  }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/reports",
        title: "Message reports",
        description: "List recent messages with optional campaign filter.",
        permission: "sms.read",
        query: ["limit", "campaignId"],
      },
    ],
  },
  {
    id: "contacts",
    title: "Contacts",
    icon: "users",
    description: "Manage contact records for campaigns.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/contacts",
        title: "List contacts",
        description: "Search and filter your contact list.",
        permission: "contacts.read",
        query: ["limit", "q", "country", "tag", "groupId"],
      },
      {
        method: "POST",
        path: "/api/v1/contacts",
        title: "Create / upsert contact",
        description: "Create or update by phone number (unique per account).",
        permission: "contacts.write",
        body: `{
  "phone": "233201234567",
  "name": "Jane",
  "email": "jane@example.com",
  "tags": "vip",
  "countryCode": "GH"
}`,
      },
      {
        method: "PUT",
        path: "/api/v1/contacts/{id}",
        title: "Update contact",
        description: "Update name, email, tags, or country on an existing contact.",
        permission: "contacts.write",
        body: `{ "name": "Jane Doe", "tags": "vip,customer" }`,
      },
      {
        method: "DELETE",
        path: "/api/v1/contacts/{id}",
        title: "Delete contact",
        description: "Permanently remove a contact by ID.",
        permission: "contacts.write",
        response: `{ "success": true, "deleted": true }`,
      },
    ],
  },
  {
    id: "campaigns",
    title: "Campaigns",
    icon: "megaphone",
    description: "Read campaign status and per-campaign messages.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/campaigns",
        title: "List campaigns",
        description: "List bulk send campaigns with optional status filter.",
        permission: "campaigns.read",
        query: ["status", "limit"],
      },
      {
        method: "GET",
        path: "/api/v1/campaigns/{id}",
        title: "Campaign detail",
        description: "Campaign metadata and delivery statistics.",
        permission: "campaigns.read",
        response: `{
  "success": true,
  "data": {
    "id": "...",
    "name": "Promo blast",
    "status": "COMPLETED",
    "delivery_stats": [{ "status": "DELIVERED", "count": 98 }]
  }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/campaigns/{id}/messages",
        title: "Campaign messages",
        description: "All messages belonging to a campaign.",
        permission: "sms.read",
        query: ["limit"],
      },
    ],
  },
  {
    id: "otp",
    title: "OTP",
    icon: "key",
    description: "Send and verify one-time codes via SMS.",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/otp/send",
        title: "Send OTP",
        description: "Send a 6-digit verification code via SMS.",
        permission: "sms.send",
        body: `{ "phone": "233201234567", "countryCode": "GH" }`,
      },
      {
        method: "POST",
        path: "/api/v1/otp/verify",
        title: "Verify OTP",
        description: "Validate the code entered by your user.",
        permission: "sms.send",
        body: `{ "phone": "233201234567", "code": "123456" }`,
        response: `{ "success": true, "verified": true }`,
      },
    ],
  },
  {
    id: "wordpress",
    title: "WordPress",
    icon: "puzzle",
    description:
      "Endpoints used by the official SplitSMS WordPress plugin — site registration, logs, and account status.",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/account/status",
        title: "Account status",
        description:
          "SMS credits, wallet balance, API key prefix, and low-balance flag. Used by the plugin dashboard header.",
        permission: "wallet.read",
        response: `{
  "success": true,
  "account": {
    "status": "active",
    "sms_credits": 12450,
    "wallet_balance": 620,
    "wallet_currency": "GHS",
    "api_key_prefix": "sk_live",
    "low_balance": false,
    "sandbox": false
  }
}`,
      },
      {
        method: "POST",
        path: "/api/v1/wordpress/connect",
        title: "Register WordPress site",
        description:
          "Called when a site saves a valid API key. Links the WordPress URL to your SplitSMS account.",
        permission: "sms.send",
        body: `{
  "site_url": "https://shop.example.com",
  "site_name": "My Shop",
  "wp_version": "6.7",
  "plugin_version": "1.1.0",
  "php_version": "8.2"
}`,
        response: `{
  "success": true,
  "site": {
    "id": "...",
    "site_url": "https://shop.example.com",
    "status": "connected"
  }
}`,
      },
      {
        method: "POST",
        path: "/api/v1/wordpress/logs",
        title: "Sync plugin log",
        description: "Push an SMS event from WordPress to your SplitSMS dashboard.",
        permission: "sms.read",
        body: `{
  "site_url": "https://shop.example.com",
  "event": "wc_order_processing",
  "recipient": "233201234567",
  "status": "sent",
  "source": "woocommerce",
  "external_ref": "order-1042"
}`,
      },
      {
        method: "GET",
        path: "/api/v1/messages/logs",
        title: "List plugin logs",
        description: "Recent WordPress/plugin events for your account.",
        permission: "sms.read",
        query: ["limit (max 100)", "status", "source", "q"],
      },
      {
        method: "GET",
        path: "/api/v1/wordpress/site-status",
        title: "Site status",
        description: "Health and recent activity for one connected site or all sites.",
        permission: "sms.read",
        query: ["site_url (optional)"],
      },
    ],
  },
];

export function curlExample(
  method: HttpMethod,
  path: string,
  body?: string,
  baseUrl = API_BASE_HINT,
) {
  const url = `${baseUrl}${path.replace("{id}", "MESSAGE_ID")}`;
  const lines = [`curl -X ${method} '${url}' \\`, `  -H "Authorization: Bearer YOUR_API_KEY" \\`];
  if (body && (method === "POST" || method === "PUT")) {
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${body.replace(/\n/g, "").replace(/\s+/g, " ")}'`);
  } else {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
  }
  return lines.join("\n");
}
