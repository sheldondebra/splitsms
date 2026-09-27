import { getSiteUrl, siteName } from "@/lib/site-config";

export type MemberOutreachVars = {
  firstName: string;
  fullName: string;
  siteName: string;
  siteUrl: string;
  onboardingUrl: string;
  dashboardUrl: string;
  senderIdsUrl: string;
  walletUrl: string;
  supportUrl: string;
};

export type MemberOutreachTemplate = {
  id: string;
  label: string;
  description: string;
  sms: string;
  emailSubject: string;
  emailText: string;
  href?: string;
  ctaLabel?: string;
};

function interpolate(template: string, vars: MemberOutreachVars) {
  return template
    .replace(/\{\{firstName\}\}/g, vars.firstName)
    .replace(/\{\{fullName\}\}/g, vars.fullName)
    .replace(/\{\{siteName\}\}/g, vars.siteName)
    .replace(/\{\{siteUrl\}\}/g, vars.siteUrl)
    .replace(/\{\{onboardingUrl\}\}/g, vars.onboardingUrl)
    .replace(/\{\{dashboardUrl\}\}/g, vars.dashboardUrl)
    .replace(/\{\{senderIdsUrl\}\}/g, vars.senderIdsUrl)
    .replace(/\{\{walletUrl\}\}/g, vars.walletUrl)
    .replace(/\{\{supportUrl\}\}/g, vars.supportUrl);
}

export function buildMemberOutreachVars(input: {
  fullName: string;
}): MemberOutreachVars {
  const siteUrl = getSiteUrl();
  const firstName = input.fullName.trim().split(/\s+/)[0] || "there";
  return {
    firstName,
    fullName: input.fullName,
    siteName,
    siteUrl,
    onboardingUrl: `${siteUrl}/onboarding`,
    dashboardUrl: `${siteUrl}/dashboard`,
    senderIdsUrl: `${siteUrl}/dashboard/sender-ids`,
    walletUrl: `${siteUrl}/dashboard/wallet`,
    supportUrl: `${siteUrl}/dashboard/support`,
  };
}

export const MEMBER_OUTREACH_TEMPLATES: MemberOutreachTemplate[] = [
  {
    id: "service_down",
    label: "Service down",
    description: "Notify customers of a temporary interruption",
    sms: "Hi {{firstName}}, {{siteName}} is temporarily unavailable. We're working to restore access as quickly as possible and will update you shortly. Thank you for your patience.",
    emailSubject: "{{siteName}} is temporarily unavailable",
    emailText: `Hi {{firstName}},

{{siteName}} is temporarily unavailable while we resolve an issue.

We're working to restore full access as quickly as possible and will let you know when everything is back online.

Thank you for your patience.

— The {{siteName}} Team`,
  },
  {
    id: "service_restored",
    label: "Service restored",
    description: "Apology after downtime — system is back online",
    sms: "Hi {{firstName}}, apologies for the temporary interruption on {{siteName}}. Everything is back up and running. Thank you for your patience.",
    emailSubject: "We're back online — thank you for your patience",
    emailText: `Hi {{firstName}},

We're sorry for the temporary interruption earlier. {{siteName}} is fully back online and working normally again.

You can sign in and continue as usual:
{{dashboardUrl}}

Thank you for your patience and for choosing {{siteName}}.

— The {{siteName}} Team`,
    href: "/dashboard",
    ctaLabel: "Open dashboard",
  },
  {
    id: "incomplete_registration",
    label: "Finish registration",
    description: "Member has not completed onboarding",
    sms: "Hi {{firstName}}, your {{siteName}} account setup is incomplete. Finish here: {{onboardingUrl}}",
    emailSubject: "Complete your {{siteName}} registration",
    emailText: `Hi {{firstName}},

You started signing up on {{siteName}} but haven't finished setup yet.

Complete your profile and get ready to send SMS:
{{onboardingUrl}}

Need help? Reply via support: {{supportUrl}}

— {{siteName}}`,
    href: "/onboarding",
    ctaLabel: "Complete registration",
  },
  {
    id: "register_sender_id",
    label: "Register a sender ID",
    description: "Prompt to add a branded sender name",
    sms: "Hi {{firstName}}, add a sender ID on {{siteName}} so recipients see your brand: {{senderIdsUrl}}",
    emailSubject: "Register your sender ID on {{siteName}}",
    emailText: `Hi {{firstName}},

To send SMS with your business name, register a sender ID on {{siteName}}:
{{senderIdsUrl}}

— {{siteName}}`,
    href: "/dashboard/sender-ids",
    ctaLabel: "Register sender ID",
  },
  {
    id: "top_up_wallet",
    label: "Top up wallet",
    description: "Low balance or no credits reminder",
    sms: "Hi {{firstName}}, top up your {{siteName}} wallet to keep sending SMS: {{walletUrl}}",
    emailSubject: "Top up your {{siteName}} wallet",
    emailText: `Hi {{firstName}},

Add credits to your {{siteName}} wallet to continue sending SMS without interruption:
{{walletUrl}}

— {{siteName}}`,
    href: "/dashboard/wallet",
    ctaLabel: "Top up wallet",
  },
  {
    id: "welcome_check_in",
    label: "Welcome check-in",
    description: "Friendly nudge after signup",
    sms: "Hi {{firstName}}, welcome to {{siteName}}! Open your dashboard to send your first SMS: {{dashboardUrl}}",
    emailSubject: "Welcome to {{siteName}}",
    emailText: `Hi {{firstName}},

Welcome to {{siteName}}. Your dashboard is ready:
{{dashboardUrl}}

Register a sender ID, top up your wallet, and send your first message when you're ready.

— {{siteName}}`,
    href: "/dashboard",
    ctaLabel: "Open dashboard",
  },
  {
    id: "support_follow_up",
    label: "Support follow-up",
    description: "Ask member to check support or reply",
    sms: "Hi {{firstName}}, we're following up from {{siteName}} support. View your tickets: {{supportUrl}}",
    emailSubject: "Follow-up from {{siteName}} support",
    emailText: `Hi {{firstName}},

We're following up on your {{siteName}} account. You can view or reply to support tickets here:
{{supportUrl}}

— {{siteName}} Team`,
    href: "/dashboard/support",
    ctaLabel: "View support",
  },
  {
    id: "custom",
    label: "Custom message",
    description: "Write your own SMS and email",
    sms: "Hi {{firstName}}, ",
    emailSubject: "Message from {{siteName}}",
    emailText: `Hi {{firstName}},\n\n\n\n— {{siteName}}`,
  },
];

export function renderMemberOutreachTemplate(
  template: MemberOutreachTemplate,
  vars: MemberOutreachVars,
) {
  return {
    sms: interpolate(template.sms, vars),
    emailSubject: interpolate(template.emailSubject, vars),
    emailText: interpolate(template.emailText, vars),
    href: template.href,
    ctaLabel: template.ctaLabel,
  };
}

export function getMemberOutreachTemplate(id: string) {
  return MEMBER_OUTREACH_TEMPLATES.find((t) => t.id === id) ?? MEMBER_OUTREACH_TEMPLATES[0];
}
