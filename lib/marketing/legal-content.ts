const updated = "May 22, 2026";
const operator = "Tecunit (SplitSMS)";

export const privacySections = {
  title: "Privacy Policy",
  updated,
  intro: `This Privacy Policy explains how ${operator} collects, uses, and protects personal data when you use the SplitSMS bulk SMS platform, website, and API.`,
  sections: [
    {
      title: "Information we collect",
      body: [
        "We collect account details (name, email, phone), billing and wallet transaction data, SMS content and delivery metadata, API usage logs, and technical information such as IP address and browser type.",
        "We do not sell your personal data to third parties.",
      ],
    },
    {
      title: "How we use your data",
      body: [
        "Data is used to provide SMS delivery, process payments, prevent fraud, improve the platform, and communicate service updates.",
        "We may use aggregated, anonymized statistics for analytics.",
      ],
    },
    {
      title: "Data retention",
      body: [
        "We retain account and message logs as needed for billing, legal compliance, and dispute resolution. You may request deletion of your account subject to legal obligations.",
      ],
    },
    {
      title: "Your rights",
      body: [
        "Depending on applicable law, you may request access, correction, or deletion of your personal data by contacting support@tecunitgh.com.",
      ],
    },
    {
      title: "Contact",
      body: ["Questions about privacy: support@tecunitgh.com · Tecunit."],
    },
  ],
};

export const termsSections = {
  title: "Terms and Conditions",
  updated,
  intro: `By using SplitSMS, you agree to these Terms and Conditions with ${operator}. Please read them before sending SMS or using our API.`,
  sections: [
    {
      title: "Service description",
      body: [
        "SplitSMS provides bulk SMS, OTP, API access, and related tools. Delivery depends on carriers, recipient networks, and compliant use.",
      ],
    },
    {
      title: "Acceptable use",
      body: [
        "You must not send spam, unlawful content, phishing, or messages without proper consent. You are responsible for complying with telecom regulations in each country you message.",
        "We may suspend accounts that violate acceptable use or harm deliverability.",
      ],
    },
    {
      title: "Pricing and payments",
      body: [
        "SMS is billed per segment based on published country rates. Wallet top-ups are non-refundable except where required by law. Free credits are promotional and may change.",
      ],
    },
    {
      title: "Limitation of liability",
      body: [
        "SplitSMS is provided as-is. We are not liable for indirect damages, lost profits, or carrier outages beyond fees paid for the affected messages in the prior month.",
      ],
    },
    {
      title: "Governing law",
      body: [
        "These terms are governed by the laws of Ghana. Disputes shall be resolved in Ghana courts unless otherwise agreed in writing.",
      ],
    },
  ],
};

export const dataProtectionSections = {
  title: "Data Protection",
  updated,
  intro: `SplitSMS is committed to protecting personal data in line with applicable data protection principles. This page summarizes our approach for customers in Ghana and internationally.`,
  sections: [
    {
      title: "Lawful processing",
      body: [
        "We process personal data on lawful bases including contract performance (providing SMS services), legitimate interests (security and fraud prevention), and consent where required.",
      ],
    },
    {
      title: "Security measures",
      body: [
        "We use encryption in transit, access controls, API key permissions, audit logging, and staff access limitations to protect your data.",
      ],
    },
    {
      title: "Sub-processors",
      body: [
        "SMS delivery may involve telecom partners and cloud infrastructure providers. We select vendors with appropriate security and require contractual safeguards.",
      ],
    },
    {
      title: "International transfers",
      body: [
        "Data may be processed on servers outside your country. We take steps to ensure adequate protection for cross-border transfers.",
      ],
    },
    {
      title: "Data Protection contact",
      body: [
        "For data protection inquiries: support@tecunitgh.com. We will respond within a reasonable timeframe.",
      ],
    },
  ],
};

export const securitySections = {
  title: "Security",
  updated,
  intro: `Security is core to SplitSMS. This page outlines how we protect your account, API keys, and SMS traffic.`,
  sections: [
    {
      title: "Account security",
      body: [
        "Passwords are hashed. Sessions use secure cookies. We recommend strong passwords and protecting your login credentials.",
      ],
    },
    {
      title: "API keys",
      body: [
        "API keys are stored encrypted. Keys can be scoped with permissions, rotated, and revoked from your dashboard. Never expose production keys in client-side code.",
      ],
    },
    {
      title: "Webhooks",
      body: [
        "Delivery webhooks can be signed with HMAC so you can verify authenticity before processing events in your systems.",
      ],
    },
    {
      title: "Rate limiting and fraud",
      body: [
        "We apply rate limits, monitoring, and audit logs to detect abuse and protect platform stability.",
      ],
    },
    {
      title: "Reporting issues",
      body: [
        "Report security concerns to support@tecunitgh.com. We investigate credible reports promptly.",
      ],
    },
  ],
};
