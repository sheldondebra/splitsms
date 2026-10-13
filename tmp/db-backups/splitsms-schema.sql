-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'RESELLER', 'ENTERPRISE', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "MessagePriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "SlaTier" AS ENUM ('STANDARD', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "EnterpriseStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYSTACK', 'FLUTTERWAVE', 'STRIPE', 'MTN_MOMO', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('WALLET_TOPUP', 'CREDIT_PURCHASE', 'SMS_DEBIT', 'REFUND', 'ADMIN_ADJUSTMENT', 'PROMO_CREDIT', 'RESELLER_SUB_FUND', 'RESELLER_PAYOUT', 'PAYMENT_REFUND');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ResellerStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ResellerCheckoutMode" AS ENUM ('PLATFORM', 'OWN');

-- CreateEnum
CREATE TYPE "ResellerPayoutMethod" AS ENUM ('MOBILE_MONEY', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "ResellerPayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PromoCodeType" AS ENUM ('PERCENT_BONUS', 'FIXED_CREDIT', 'WALLET_BONUS');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "SmsProviderType" AS ENUM ('INFOBIP', 'TWILIO', 'MNOTIFY', 'EASYSENDSMS');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "CampaignRecurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DAYS');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('MANUAL', 'SIGNUP', 'BIRTHDAY', 'LOW_BALANCE', 'CAMPAIGN_COMPLETE');

-- CreateEnum
CREATE TYPE "SenderIdStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SenderIdDocumentType" AS ENUM ('BUSINESS_REGISTRATION', 'PASSPORT', 'GHANA_CARD', 'OTHER_ID');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupChunkKind" AS ENUM ('RAW_JSON', 'ZIP_BYTES');

-- CreateEnum
CREATE TYPE "SenderIdProviderType" AS ENUM ('MNOTIFY', 'TWILIO', 'INFOBIP', 'EASYSENDSMS');

-- CreateEnum
CREATE TYPE "SenderIdProviderStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "MemberAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('SIGNUP_VERIFY', 'LOGIN', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LOW_BALANCE', 'CAMPAIGN_COMPLETED', 'SMS_FAILED', 'WALLET_FUNDED', 'OTP_SENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ResellerClientSignupSource" AS ENUM ('MANUAL', 'INVITE_SHARE', 'INVITE_DOMAIN');

-- CreateEnum
CREATE TYPE "SmartFormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SmartFormFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'PHONE', 'EMAIL', 'NUMBER', 'SELECT', 'RADIO', 'CHECKBOX', 'DATE', 'TIME', 'CONSENT', 'SECTION', 'DIVIDER');

-- CreateEnum
CREATE TYPE "SmartFormAnalyticsEventType" AS ENUM ('VIEW', 'UNIQUE_VIEW', 'SHORTLINK_CLICK', 'OPEN', 'SHARE', 'QR_SCAN', 'SUBMIT', 'EXPORT', 'EMBED_LOAD', 'WORDPRESS_LOAD', 'SMS_SENT', 'SMS_FAILED', 'CONTACT_SAVED');

-- CreateEnum
CREATE TYPE "SmartFormContactSaveStatus" AS ENUM ('PENDING', 'SAVED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "SmartFormSmsStatus" AS ENUM ('NONE', 'SENT', 'FAILED', 'QUEUED');

-- CreateEnum
CREATE TYPE "SmartFormExportType" AS ENUM ('CSV', 'EXCEL', 'PDF');

-- CreateEnum
CREATE TYPE "SmartFormReportFrequency" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "EmailMarketingCampaignStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "accountNumber" INTEGER,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "staffPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "referralCode" TEXT,
    "email" TEXT,
    "googleId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberAccount" (
    "userId" TEXT NOT NULL,
    "status" "MemberAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "suspendedReason" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "maxSenderIds" INTEGER NOT NULL DEFAULT 5,
    "senderIdsBlocked" BOOLEAN NOT NULL DEFAULT false,
    "assignedProvider" "SmsProviderType",
    "featureApi" BOOLEAN NOT NULL DEFAULT true,
    "featureCampaigns" BOOLEAN NOT NULL DEFAULT true,
    "featureWebhooks" BOOLEAN NOT NULL DEFAULT true,
    "featureBulkSms" BOOLEAN NOT NULL DEFAULT true,
    "featureWordPress" BOOLEAN NOT NULL DEFAULT true,
    "adminNote" TEXT,
    "onboardingCompletedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "MemberAccount_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Reseller" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "brandName" TEXT,
    "domain" TEXT,
    "inviteCode" TEXT,
    "inviteShareViews" INTEGER NOT NULL DEFAULT 0,
    "inviteDomainViews" INTEGER NOT NULL DEFAULT 0,
    "inviteLastViewedAt" TIMESTAMP(3),
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "status" "ResellerStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dailySmsLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reseller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResellerUser" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signupSource" "ResellerClientSignupSource" NOT NULL DEFAULT 'MANUAL',
    "dailySmsLimit" INTEGER,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResellerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResellerCountryPricing" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "sellPrice" DECIMAL(10,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResellerCountryPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResellerCommission" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "source" TEXT NOT NULL,
    "referenceId" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResellerCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelBrand" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#f97316',
    "secondaryColor" TEXT DEFAULT '#0f0f0f',
    "accentColor" TEXT,
    "supportEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResellerPaymentSettings" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "checkoutMode" "ResellerCheckoutMode" NOT NULL DEFAULT 'PLATFORM',
    "paystackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "paystackPublicKey" TEXT,
    "paystackSecretKey" TEXT,
    "stripeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripePublishableKey" TEXT,
    "stripeSecretKey" TEXT,
    "payoutMethod" "ResellerPayoutMethod" NOT NULL DEFAULT 'MOBILE_MONEY',
    "payoutPhone" TEXT,
    "payoutAccountName" TEXT,
    "payoutBankName" TEXT,
    "payoutAccountNumber" TEXT,
    "payoutNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResellerPaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResellerPayoutRequest" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "ResellerPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "method" "ResellerPayoutMethod" NOT NULL,
    "phone" TEXT,
    "accountName" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "resellerNote" TEXT,
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResellerPayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'SIGNUP_VERIFY',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "credits" INTEGER,
    "description" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "balanceBefore" DECIMAL(14,2),
    "balanceAfter" DECIMAL(14,2),
    "metadata" JSONB,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "providerReference" TEXT,
    "proofUrl" TEXT,
    "adminNote" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "provider" "PaymentMethod" NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "providerRefundId" TEXT,
    "failureReason" TEXT,
    "walletDebited" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "initiatedById" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dialCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsPricing" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mNotify',
    "creditsPerSms" INTEGER NOT NULL DEFAULT 1,
    "costPrice" DECIMAL(10,4) NOT NULL DEFAULT 0.02,
    "memberPrice" DECIMAL(10,4) NOT NULL,
    "resellerPrice" DECIMAL(10,4),
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSmsPricing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "sellPrice" DECIMAL(10,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSmsPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PAID',
    "items" JSONB NOT NULL,
    "paymentId" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromoCodeType" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "resellerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoRedemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsProvider" (
    "id" TEXT NOT NULL,
    "type" "SmsProviderType" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,

    CONSTRAINT "SmsProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsRoute" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SmsRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsRouteStep" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "SmsRouteStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "countryCode" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationWorkflow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "AutomationTrigger" NOT NULL DEFAULT 'MANUAL',
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,

    CONSTRAINT "ContactGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "contactGroupId" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DECIMAL(14,2),
    "countryCode" TEXT NOT NULL DEFAULT 'GH',
    "recipientsText" TEXT,
    "recurrence" "CampaignRecurrence" NOT NULL DEFAULT 'NONE',
    "recurrenceDays" INTEGER,
    "recurrenceEndAt" TIMESTAMP(3),
    "parentCampaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "recipient" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "countryCode" TEXT,
    "isSandbox" BOOLEAN NOT NULL DEFAULT false,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "cost" DECIMAL(10,4),
    "smsUnits" INTEGER NOT NULL DEFAULT 1,
    "providerType" "SmsProviderType",
    "providerRef" TEXT,
    "senderId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "priority" "MessagePriority" NOT NULL DEFAULT 'MEDIUM',
    "channel" TEXT,
    "slowDlrResent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsRoutingLog" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "recipient" TEXT,
    "recipientCountry" TEXT,
    "routeCountry" TEXT NOT NULL,
    "providerOrder" JSONB NOT NULL,
    "selectedProvider" "SmsProviderType",
    "attempts" JSONB,
    "reason" TEXT NOT NULL,
    "autoRouted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsRoutingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderId" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "status" "SenderIdStatus" NOT NULL DEFAULT 'PENDING',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "adminNote" TEXT,
    "providerStatus" TEXT,
    "providerSubmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderIdVerificationDocument" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docType" "SenderIdDocumentType" NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SenderIdVerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupJob" (
    "id" TEXT NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'RUNNING',
    "categories" JSONB NOT NULL,
    "filters" JSONB,
    "progress" JSONB NOT NULL,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "completedSteps" INTEGER NOT NULL DEFAULT 0,
    "fileSizeBytes" INTEGER,
    "emailTo" TEXT,
    "error" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BackupJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupFileChunk" (
    "id" TEXT NOT NULL,
    "backupId" TEXT NOT NULL,
    "kind" "BackupChunkKind" NOT NULL,
    "category" TEXT,
    "index" INTEGER NOT NULL,
    "dataJson" JSONB,
    "dataBytes" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupFileChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderIdProviderRegistration" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "provider" "SenderIdProviderType" NOT NULL,
    "status" "SenderIdProviderStatus" NOT NULL DEFAULT 'PENDING',
    "externalRef" TEXT,
    "providerStatus" TEXT,
    "error" TEXT,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderIdProviderRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY['sms.send', 'sms.read', 'wallet.read', 'contacts.read', 'contacts.write', 'campaigns.read']::TEXT[],
    "isSandbox" BOOLEAN NOT NULL DEFAULT false,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "reference" INTEGER,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "slackThreadTs" TEXT,
    "slackChannelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" TEXT[] DEFAULT ARRAY['message.delivered', 'message.failed']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDeliveryLog" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "apiKeyId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "ip" TEXT,
    "requestBytes" INTEGER,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DedicatedRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "lockedProvider" "SmsProviderType",
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DedicatedRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "slaTier" "SlaTier" NOT NULL DEFAULT 'STANDARD',
    "status" "EnterpriseStatus" NOT NULL DEFAULT 'PENDING',
    "throughputPerSec" INTEGER NOT NULL DEFAULT 10,
    "ipWhitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "apiRateLimit" INTEGER NOT NULL DEFAULT 500,
    "dedicatedRouteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseCredit" (
    "id" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "creditLimit" DECIMAL(14,2) NOT NULL,
    "usedCredit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmppAccount" (
    "id" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "throughput" INTEGER NOT NULL DEFAULT 10,
    "ipWhitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmppAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmppSession" (
    "id" TEXT NOT NULL,
    "smppAccountId" TEXT NOT NULL,
    "bindType" TEXT NOT NULL,
    "clientIp" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "SmppSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmppSubmitLog" (
    "id" TEXT NOT NULL,
    "smppAccountId" TEXT NOT NULL,
    "messageId" TEXT,
    "sourceAddr" TEXT NOT NULL,
    "destAddr" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmppSubmitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordPressSite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "siteUrl" TEXT NOT NULL,
    "siteName" TEXT,
    "wpVersion" TEXT,
    "pluginVersion" TEXT,
    "phpVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordPressSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectCustomer" (
    "id" TEXT NOT NULL,
    "partnerUserId" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "externalRef" TEXT,
    "label" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordPressLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT,
    "event" TEXT NOT NULL,
    "recipient" TEXT,
    "messageType" TEXT,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "body" TEXT,
    "cost" DECIMAL(10,4),
    "externalRef" TEXT,
    "messageId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordPressLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartForm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "description" TEXT,
    "status" "SmartFormStatus" NOT NULL DEFAULT 'DRAFT',
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "themeSettings" JSONB,
    "layoutSettings" JSONB,
    "successSettings" JSONB,
    "contactGroupId" TEXT,
    "saveToContacts" BOOLEAN NOT NULL DEFAULT false,
    "preventDuplicatePhone" BOOLEAN NOT NULL DEFAULT false,
    "preventDuplicateEmail" BOOLEAN NOT NULL DEFAULT false,
    "captchaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "submissionLimit" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartFormField" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldType" "SmartFormFieldType" NOT NULL,
    "placeholder" TEXT,
    "helperText" TEXT,
    "defaultValue" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "validationRules" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartFormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartFormResponse" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT,
    "source" TEXT,
    "deviceType" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactSaveStatus" "SmartFormContactSaveStatus" NOT NULL DEFAULT 'PENDING',
    "smsStatus" "SmartFormSmsStatus" NOT NULL DEFAULT 'NONE',
    "smsError" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartFormResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartFormResponseAnswer" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "fieldId" TEXT,
    "fieldKey" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartFormResponseAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartFormAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "SmartFormAnalyticsEventType" NOT NULL,
    "source" TEXT,
    "deviceType" TEXT,
    "referrer" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartFormAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartFormSmsAutomation" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "sendToRespondent" BOOLEAN NOT NULL DEFAULT false,
    "sendToAdmin" BOOLEAN NOT NULL DEFAULT false,
    "adminPhone" TEXT,
    "senderId" TEXT,
    "respondentMessageTemplate" TEXT,
    "adminMessageTemplate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartFormSmsAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartFormEmailAutomation" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "sendToRespondent" BOOLEAN NOT NULL DEFAULT false,
    "sendToAdmin" BOOLEAN NOT NULL DEFAULT false,
    "adminEmail" TEXT,
    "respondentSubject" TEXT,
    "respondentMessageTemplate" TEXT,
    "adminSubject" TEXT,
    "adminMessageTemplate" TEXT,
    "reportFrequency" "SmartFormReportFrequency" NOT NULL DEFAULT 'NONE',
    "reportEmail" TEXT,
    "lastReportSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartFormEmailAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartFormExport" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exportType" "SmartFormExportType" NOT NULL,
    "fileUrl" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartFormExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'feature',
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "headline" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "footerNote" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMarketingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "headline" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "footerNote" TEXT,
    "audienceType" TEXT NOT NULL,
    "audienceMeta" JSONB,
    "status" "EmailMarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "EmailMarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingImage" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMarketingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingDelivery" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMarketingDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "source" TEXT NOT NULL DEFAULT 'footer',
    "status" TEXT NOT NULL DEFAULT 'subscribed',
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMarketingSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingCampaignMeta" (
    "campaignId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "uniqueOpenCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueClickCount" INTEGER NOT NULL DEFAULT 0,
    "unsubscribeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMarketingCampaignMeta_pkey" PRIMARY KEY ("campaignId")
);

-- CreateTable
CREATE TABLE "EmailMarketingEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "email" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMarketingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingSuppression" (
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'unsubscribe',
    "source" TEXT NOT NULL DEFAULT 'campaign',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMarketingSuppression_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "GoogleConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleSubject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tokenExpiry" TIMESTAMP(3),
    "lastError" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleFormSmsAutomation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "formTitle" TEXT,
    "phoneFieldId" TEXT NOT NULL,
    "questionTitles" JSONB,
    "senderId" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cursor" TEXT,
    "lastPolledAt" TIMESTAMP(3),
    "lastError" TEXT,
    "contactGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleFormSmsAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleFormSmsSend" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "contactId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleFormSmsSend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_accountNumber_key" ON "User"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "MemberAccount_status_idx" ON "MemberAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Reseller_userId_key" ON "Reseller"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reseller_domain_key" ON "Reseller"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Reseller_inviteCode_key" ON "Reseller"("inviteCode");

-- CreateIndex
CREATE INDEX "Reseller_status_idx" ON "Reseller"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ResellerUser_userId_key" ON "ResellerUser"("userId");

-- CreateIndex
CREATE INDEX "ResellerUser_resellerId_idx" ON "ResellerUser"("resellerId");

-- CreateIndex
CREATE UNIQUE INDEX "ResellerCountryPricing_resellerId_countryCode_key" ON "ResellerCountryPricing"("resellerId", "countryCode");

-- CreateIndex
CREATE INDEX "ResellerCommission_resellerId_createdAt_idx" ON "ResellerCommission"("resellerId", "createdAt");

-- CreateIndex
CREATE INDEX "ResellerCommission_resellerId_paidAt_idx" ON "ResellerCommission"("resellerId", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelBrand_resellerId_key" ON "WhiteLabelBrand"("resellerId");

-- CreateIndex
CREATE UNIQUE INDEX "ResellerPaymentSettings_resellerId_key" ON "ResellerPaymentSettings"("resellerId");

-- CreateIndex
CREATE INDEX "ResellerPayoutRequest_resellerId_createdAt_idx" ON "ResellerPayoutRequest"("resellerId", "createdAt");

-- CreateIndex
CREATE INDEX "ResellerPayoutRequest_status_createdAt_idx" ON "ResellerPayoutRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "OtpSession_phone_purpose_idx" ON "OtpSession"("phone", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "AuthAttempt_key_key" ON "AuthAttempt"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsCredit_userId_key" ON "SmsCredit"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerReference_key" ON "Payment"("providerReference");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_method_status_idx" ON "Payment"("method", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_transactionId_key" ON "Refund"("transactionId");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE INDEX "Refund_userId_createdAt_idx" ON "Refund"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SmsPricing_countryId_key" ON "SmsPricing"("countryId");

-- CreateIndex
CREATE INDEX "UserSmsPricing_userId_idx" ON "UserSmsPricing"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSmsPricing_userId_countryCode_key" ON "UserSmsPricing"("userId", "countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "Invoice_userId_createdAt_idx" ON "Invoice"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_resellerId_idx" ON "PromoCode"("resellerId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoRedemption_userId_promoCodeId_key" ON "PromoRedemption"("userId", "promoCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsProvider_type_key" ON "SmsProvider"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SmsRoute_countryId_key" ON "SmsRoute"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsRouteStep_routeId_priority_key" ON "SmsRouteStep"("routeId", "priority");

-- CreateIndex
CREATE INDEX "Contact_userId_phone_idx" ON "Contact"("userId", "phone");

-- CreateIndex
CREATE INDEX "Contact_userId_countryCode_idx" ON "Contact"("userId", "countryCode");

-- CreateIndex
CREATE INDEX "Contact_userId_createdAt_idx" ON "Contact"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_userId_phone_key" ON "Contact"("userId", "phone");

-- CreateIndex
CREATE INDEX "SmsTemplate_userId_idx" ON "SmsTemplate"("userId");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_userId_isActive_idx" ON "AutomationWorkflow"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ContactGroupMember_groupId_contactId_key" ON "ContactGroupMember"("groupId", "contactId");

-- CreateIndex
CREATE INDEX "Campaign_userId_status_idx" ON "Campaign"("userId", "status");

-- CreateIndex
CREATE INDEX "Campaign_status_scheduledAt_idx" ON "Campaign"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Message_userId_status_createdAt_idx" ON "Message"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Message_campaignId_idx" ON "Message"("campaignId");

-- CreateIndex
CREATE INDEX "Message_priority_status_idx" ON "Message"("priority", "status");

-- CreateIndex
CREATE INDEX "SmsRoutingLog_createdAt_idx" ON "SmsRoutingLog"("createdAt");

-- CreateIndex
CREATE INDEX "SmsRoutingLog_messageId_idx" ON "SmsRoutingLog"("messageId");

-- CreateIndex
CREATE INDEX "SmsRoutingLog_routeCountry_createdAt_idx" ON "SmsRoutingLog"("routeCountry", "createdAt");

-- CreateIndex
CREATE INDEX "SenderId_userId_status_idx" ON "SenderId"("userId", "status");

-- CreateIndex
CREATE INDEX "SenderIdVerificationDocument_senderId_idx" ON "SenderIdVerificationDocument"("senderId");

-- CreateIndex
CREATE INDEX "SenderIdVerificationDocument_userId_idx" ON "SenderIdVerificationDocument"("userId");

-- CreateIndex
CREATE INDEX "BackupJob_createdAt_idx" ON "BackupJob"("createdAt");

-- CreateIndex
CREATE INDEX "BackupFileChunk_backupId_kind_category_index_idx" ON "BackupFileChunk"("backupId", "kind", "category", "index");

-- CreateIndex
CREATE INDEX "SenderIdProviderRegistration_senderId_idx" ON "SenderIdProviderRegistration"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "SenderIdProviderRegistration_senderId_provider_key" ON "SenderIdProviderRegistration"("senderId", "provider");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_reference_key" ON "SupportTicket"("reference");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_slackThreadTs_idx" ON "SupportTicket"("slackThreadTs");

-- CreateIndex
CREATE INDEX "SupportTicketReply_ticketId_createdAt_idx" ON "SupportTicketReply"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE INDEX "RateLimitBucket_updatedAt_idx" ON "RateLimitBucket"("updatedAt");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_userId_idx" ON "WebhookEndpoint"("userId");

-- CreateIndex
CREATE INDEX "WebhookDeliveryLog_endpointId_createdAt_idx" ON "WebhookDeliveryLog"("endpointId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookDeliveryLog_success_nextRetryAt_idx" ON "WebhookDeliveryLog"("success", "nextRetryAt");

-- CreateIndex
CREATE INDEX "ApiLog_userId_createdAt_idx" ON "ApiLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiLog_apiKeyId_createdAt_idx" ON "ApiLog"("apiKeyId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiLog_createdAt_idx" ON "ApiLog"("createdAt");

-- CreateIndex
CREATE INDEX "DedicatedRoute_countryCode_isActive_idx" ON "DedicatedRoute"("countryCode", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseAccount_userId_key" ON "EnterpriseAccount"("userId");

-- CreateIndex
CREATE INDEX "EnterpriseAccount_status_idx" ON "EnterpriseAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseCredit_enterpriseId_key" ON "EnterpriseCredit"("enterpriseId");

-- CreateIndex
CREATE UNIQUE INDEX "SmppAccount_enterpriseId_key" ON "SmppAccount"("enterpriseId");

-- CreateIndex
CREATE UNIQUE INDEX "SmppAccount_systemId_key" ON "SmppAccount"("systemId");

-- CreateIndex
CREATE INDEX "SmppAccount_systemId_idx" ON "SmppAccount"("systemId");

-- CreateIndex
CREATE INDEX "SmppSession_smppAccountId_isActive_idx" ON "SmppSession"("smppAccountId", "isActive");

-- CreateIndex
CREATE INDEX "SmppSubmitLog_smppAccountId_createdAt_idx" ON "SmppSubmitLog"("smppAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "WordPressSite_userId_status_idx" ON "WordPressSite"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WordPressSite_userId_siteUrl_key" ON "WordPressSite"("userId", "siteUrl");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectCustomer_customerUserId_key" ON "ConnectCustomer"("customerUserId");

-- CreateIndex
CREATE INDEX "ConnectCustomer_partnerUserId_idx" ON "ConnectCustomer"("partnerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectCustomer_partnerUserId_externalRef_key" ON "ConnectCustomer"("partnerUserId", "externalRef");

-- CreateIndex
CREATE INDEX "WordPressLog_userId_createdAt_idx" ON "WordPressLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WordPressLog_siteId_createdAt_idx" ON "WordPressLog"("siteId", "createdAt");

-- CreateIndex
CREATE INDEX "WordPressLog_status_idx" ON "WordPressLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SmartForm_shortCode_key" ON "SmartForm"("shortCode");

-- CreateIndex
CREATE INDEX "SmartForm_userId_status_idx" ON "SmartForm"("userId", "status");

-- CreateIndex
CREATE INDEX "SmartForm_userId_createdAt_idx" ON "SmartForm"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SmartForm_userId_slug_key" ON "SmartForm"("userId", "slug");

-- CreateIndex
CREATE INDEX "SmartFormField_formId_sortOrder_idx" ON "SmartFormField"("formId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SmartFormField_formId_fieldKey_key" ON "SmartFormField"("formId", "fieldKey");

-- CreateIndex
CREATE INDEX "SmartFormResponse_formId_submittedAt_idx" ON "SmartFormResponse"("formId", "submittedAt");

-- CreateIndex
CREATE INDEX "SmartFormResponse_userId_submittedAt_idx" ON "SmartFormResponse"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "SmartFormResponseAnswer_responseId_idx" ON "SmartFormResponseAnswer"("responseId");

-- CreateIndex
CREATE INDEX "SmartFormAnalyticsEvent_formId_eventType_createdAt_idx" ON "SmartFormAnalyticsEvent"("formId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "SmartFormAnalyticsEvent_userId_createdAt_idx" ON "SmartFormAnalyticsEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SmartFormSmsAutomation_formId_key" ON "SmartFormSmsAutomation"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "SmartFormEmailAutomation_formId_key" ON "SmartFormEmailAutomation"("formId");

-- CreateIndex
CREATE INDEX "SmartFormEmailAutomation_reportFrequency_lastReportSentAt_idx" ON "SmartFormEmailAutomation"("reportFrequency", "lastReportSentAt");

-- CreateIndex
CREATE INDEX "SmartFormExport_formId_createdAt_idx" ON "SmartFormExport"("formId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMarketingTemplate_slug_key" ON "EmailMarketingTemplate"("slug");

-- CreateIndex
CREATE INDEX "EmailMarketingTemplate_category_idx" ON "EmailMarketingTemplate"("category");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaign_createdAt_idx" ON "EmailMarketingCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaign_status_idx" ON "EmailMarketingCampaign"("status");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaign_createdById_idx" ON "EmailMarketingCampaign"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMarketingImage_kind_targetId_key" ON "EmailMarketingImage"("kind", "targetId");

-- CreateIndex
CREATE INDEX "EmailMarketingDelivery_campaignId_status_idx" ON "EmailMarketingDelivery"("campaignId", "status");

-- CreateIndex
CREATE INDEX "EmailMarketingDelivery_email_idx" ON "EmailMarketingDelivery"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMarketingSubscriber_email_key" ON "EmailMarketingSubscriber"("email");

-- CreateIndex
CREATE INDEX "EmailMarketingSubscriber_status_idx" ON "EmailMarketingSubscriber"("status");

-- CreateIndex
CREATE INDEX "EmailMarketingSubscriber_createdAt_idx" ON "EmailMarketingSubscriber"("createdAt");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaignMeta_scheduledAt_idx" ON "EmailMarketingCampaignMeta"("scheduledAt");

-- CreateIndex
CREATE INDEX "EmailMarketingEvent_campaignId_kind_idx" ON "EmailMarketingEvent"("campaignId", "kind");

-- CreateIndex
CREATE INDEX "EmailMarketingEvent_deliveryId_kind_idx" ON "EmailMarketingEvent"("deliveryId", "kind");

-- CreateIndex
CREATE INDEX "EmailMarketingEvent_email_kind_idx" ON "EmailMarketingEvent"("email", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleConnection_userId_key" ON "GoogleConnection"("userId");

-- CreateIndex
CREATE INDEX "GoogleConnection_googleSubject_idx" ON "GoogleConnection"("googleSubject");

-- CreateIndex
CREATE INDEX "GoogleFormSmsAutomation_isActive_lastPolledAt_idx" ON "GoogleFormSmsAutomation"("isActive", "lastPolledAt");

-- CreateIndex
CREATE INDEX "GoogleFormSmsAutomation_userId_idx" ON "GoogleFormSmsAutomation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleFormSmsAutomation_userId_formId_key" ON "GoogleFormSmsAutomation"("userId", "formId");

-- CreateIndex
CREATE INDEX "GoogleFormSmsSend_automationId_createdAt_idx" ON "GoogleFormSmsSend"("automationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleFormSmsSend_automationId_responseId_key" ON "GoogleFormSmsSend"("automationId", "responseId");

-- AddForeignKey
ALTER TABLE "MemberAccount" ADD CONSTRAINT "MemberAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reseller" ADD CONSTRAINT "Reseller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerUser" ADD CONSTRAINT "ResellerUser_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerUser" ADD CONSTRAINT "ResellerUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerCountryPricing" ADD CONSTRAINT "ResellerCountryPricing_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerCommission" ADD CONSTRAINT "ResellerCommission_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelBrand" ADD CONSTRAINT "WhiteLabelBrand_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerPaymentSettings" ADD CONSTRAINT "ResellerPaymentSettings_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerPayoutRequest" ADD CONSTRAINT "ResellerPayoutRequest_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpSession" ADD CONSTRAINT "OtpSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsCredit" ADD CONSTRAINT "SmsCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsPricing" ADD CONSTRAINT "SmsPricing_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSmsPricing" ADD CONSTRAINT "UserSmsPricing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsRoute" ADD CONSTRAINT "SmsRoute_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsRouteStep" ADD CONSTRAINT "SmsRouteStep_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "SmsRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsRouteStep" ADD CONSTRAINT "SmsRouteStep_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "SmsProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactGroup" ADD CONSTRAINT "ContactGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsTemplate" ADD CONSTRAINT "SmsTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationWorkflow" ADD CONSTRAINT "AutomationWorkflow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactGroupMember" ADD CONSTRAINT "ContactGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ContactGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactGroupMember" ADD CONSTRAINT "ContactGroupMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_contactGroupId_fkey" FOREIGN KEY ("contactGroupId") REFERENCES "ContactGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsRoutingLog" ADD CONSTRAINT "SmsRoutingLog_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderId" ADD CONSTRAINT "SenderId_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderIdVerificationDocument" ADD CONSTRAINT "SenderIdVerificationDocument_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "SenderId"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderIdVerificationDocument" ADD CONSTRAINT "SenderIdVerificationDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupJob" ADD CONSTRAINT "BackupJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupFileChunk" ADD CONSTRAINT "BackupFileChunk_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "BackupJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderIdProviderRegistration" ADD CONSTRAINT "SenderIdProviderRegistration_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "SenderId"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketReply" ADD CONSTRAINT "SupportTicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketReply" ADD CONSTRAINT "SupportTicketReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDeliveryLog" ADD CONSTRAINT "WebhookDeliveryLog_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiLog" ADD CONSTRAINT "ApiLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiLog" ADD CONSTRAINT "ApiLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseAccount" ADD CONSTRAINT "EnterpriseAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseAccount" ADD CONSTRAINT "EnterpriseAccount_dedicatedRouteId_fkey" FOREIGN KEY ("dedicatedRouteId") REFERENCES "DedicatedRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseCredit" ADD CONSTRAINT "EnterpriseCredit_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmppAccount" ADD CONSTRAINT "SmppAccount_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmppSession" ADD CONSTRAINT "SmppSession_smppAccountId_fkey" FOREIGN KEY ("smppAccountId") REFERENCES "SmppAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmppSubmitLog" ADD CONSTRAINT "SmppSubmitLog_smppAccountId_fkey" FOREIGN KEY ("smppAccountId") REFERENCES "SmppAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPressSite" ADD CONSTRAINT "WordPressSite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectCustomer" ADD CONSTRAINT "ConnectCustomer_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectCustomer" ADD CONSTRAINT "ConnectCustomer_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPressLog" ADD CONSTRAINT "WordPressLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPressLog" ADD CONSTRAINT "WordPressLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "WordPressSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartForm" ADD CONSTRAINT "SmartForm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartForm" ADD CONSTRAINT "SmartForm_contactGroupId_fkey" FOREIGN KEY ("contactGroupId") REFERENCES "ContactGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormField" ADD CONSTRAINT "SmartFormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "SmartForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormResponse" ADD CONSTRAINT "SmartFormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "SmartForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormResponse" ADD CONSTRAINT "SmartFormResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormResponseAnswer" ADD CONSTRAINT "SmartFormResponseAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SmartFormResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormResponseAnswer" ADD CONSTRAINT "SmartFormResponseAnswer_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "SmartFormField"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormAnalyticsEvent" ADD CONSTRAINT "SmartFormAnalyticsEvent_formId_fkey" FOREIGN KEY ("formId") REFERENCES "SmartForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormAnalyticsEvent" ADD CONSTRAINT "SmartFormAnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormSmsAutomation" ADD CONSTRAINT "SmartFormSmsAutomation_formId_fkey" FOREIGN KEY ("formId") REFERENCES "SmartForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormEmailAutomation" ADD CONSTRAINT "SmartFormEmailAutomation_formId_fkey" FOREIGN KEY ("formId") REFERENCES "SmartForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormExport" ADD CONSTRAINT "SmartFormExport_formId_fkey" FOREIGN KEY ("formId") REFERENCES "SmartForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartFormExport" ADD CONSTRAINT "SmartFormExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMarketingCampaign" ADD CONSTRAINT "EmailMarketingCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailMarketingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMarketingCampaign" ADD CONSTRAINT "EmailMarketingCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMarketingDelivery" ADD CONSTRAINT "EmailMarketingDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailMarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleConnection" ADD CONSTRAINT "GoogleConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleFormSmsAutomation" ADD CONSTRAINT "GoogleFormSmsAutomation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleFormSmsAutomation" ADD CONSTRAINT "GoogleFormSmsAutomation_contactGroupId_fkey" FOREIGN KEY ("contactGroupId") REFERENCES "ContactGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleFormSmsSend" ADD CONSTRAINT "GoogleFormSmsSend_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "GoogleFormSmsAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
