import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import {
  provisionConnectCustomer,
  serializeConnectCustomer,
} from "@/lib/connect/provision";
import { z } from "zod";

export const GET = withApi(
  async (request, ctx) => {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
    const externalRef = url.searchParams.get("external_ref");

    const links = await prisma.connectCustomer.findMany({
      where: {
        partnerUserId: ctx.user.id,
        ...(externalRef ? { externalRef } : {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            countryCode: true,
            createdAt: true,
            wallet: true,
            smsCredit: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return apiSuccess({
      data: links.map((l) =>
        serializeConnectCustomer(l, l.customer.wallet, l.customer.smsCredit),
      ),
    });
  },
  "/api/v1/connect/customers",
  "connect.customers",
);

const createSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(8),
  country_code: z.string().length(2),
  email: z.string().email().optional(),
  external_ref: z.string().min(1).max(128).optional(),
  label: z.string().optional(),
  initial_sms_credits: z.number().int().min(0).optional(),
  initial_wallet_balance: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
});

export const POST = withApi(
  async (request, ctx) => {
    const body = createSchema.safeParse(await request.json());
    if (!body.success) {
      return apiError("INVALID_REQUEST", "Invalid customer payload", 400);
    }

    const result = await provisionConnectCustomer({
      partnerUserId: ctx.user.id,
      fullName: body.data.full_name,
      phone: body.data.phone,
      countryCode: body.data.country_code,
      email: body.data.email,
      externalRef: body.data.external_ref,
      label: body.data.label,
      initialSmsCredits: body.data.initial_sms_credits,
      initialWalletBalance: body.data.initial_wallet_balance,
      currency: body.data.currency,
    });

    if (!result.ok) {
      if (result.error === "external_ref already exists" && result.customer) {
        const full = await prisma.connectCustomer.findUnique({
          where: { id: result.customer.id },
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                countryCode: true,
                createdAt: true,
                wallet: true,
                smsCredit: true,
              },
            },
          },
        });
        if (full) {
          return apiSuccess(
            { data: serializeConnectCustomer(full, full.customer.wallet, full.customer.smsCredit) },
            200,
          );
        }
      }
      return apiError("INVALID_REQUEST", result.error, 400);
    }

    const full = await prisma.connectCustomer.findUnique({
      where: { id: result.customer.id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            countryCode: true,
            createdAt: true,
            wallet: true,
            smsCredit: true,
          },
        },
      },
    });
    if (!full) return apiError("INTERNAL_ERROR", "Customer created but not found", 500);

    return apiSuccess(
      {
        data: serializeConnectCustomer(
          full,
          full.customer.wallet,
          full.customer.smsCredit,
        ),
      },
      201,
    );
  },
  "/api/v1/connect/customers",
  "connect.customers",
);
