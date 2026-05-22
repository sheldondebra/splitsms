/* eslint-disable @typescript-eslint/no-require-imports */
import net from "net";
import { verifySmppBind } from "@/lib/enterprise/smpp-auth";
import { handleSmppSubmit } from "@/lib/smpp/submit";
import { prisma } from "@/lib/db";
import { updateMessageFromDlr } from "@/lib/queue/process-message";

// smpp package has no official TypeScript types
const smpp = require("smpp") as {
  createServer: (
    opts: { debug?: boolean },
    handler: (session: SmppSession) => void,
  ) => net.Server;
};

type SmppPdu = {
  command: string;
  command_status: number;
  system_id?: string;
  password?: string;
  source_addr?: string;
  destination_addr?: string;
  short_message?: { message?: string } | string;
  message_id?: string;
  response: (opts?: Record<string, unknown>) => SmppPdu;
};

type SmppSession = {
  on: (event: string, handler: (pdu: SmppPdu) => void) => void;
  send: (pdu: SmppPdu) => void;
  close: () => void;
  remoteAddress?: string;
};

const throughputBuckets = new Map<string, { tokens: number; lastRefill: number }>();

function allowThroughput(accountId: string, limitPerSec: number): boolean {
  const now = Date.now();
  let bucket = throughputBuckets.get(accountId);
  if (!bucket) {
    bucket = { tokens: limitPerSec, lastRefill: now };
    throughputBuckets.set(accountId, bucket);
  }
  const elapsed = (now - bucket.lastRefill) / 1000;
  if (elapsed >= 1) {
    bucket.tokens = Math.min(limitPerSec, bucket.tokens + Math.floor(elapsed) * limitPerSec);
    bucket.lastRefill = now;
  }
  if (bucket.tokens <= 0) return false;
  bucket.tokens -= 1;
  return true;
}

function bindResponse(pdu: SmppPdu, status = 0) {
  return pdu.response({ command_status: status, system_id: pdu.system_id ?? "SPLITSMS" });
}

function extractMessage(pdu: SmppPdu): string {
  const sm = pdu.short_message;
  if (typeof sm === "string") return sm;
  if (sm && typeof sm === "object" && "message" in sm) {
    return String((sm as { message?: string }).message ?? "");
  }
  return "";
}

export function startSmppGateway(port = 2775) {
  const server = smpp.createServer({ debug: false }, (session: SmppSession) => {
    let boundAccountId: string | null = null;
    let boundEnterpriseId: string | null = null;
    let throughput = 10;
    const clientIp = session.remoteAddress ?? null;

    const onBind = async (pdu: SmppPdu, bindType: string) => {
      const systemId = pdu.system_id ?? "";
      const password = pdu.password ?? "";
      const result = await verifySmppBind(systemId, password, clientIp);

      if (!result.ok) {
        session.send(bindResponse(pdu, 0x0000000d));
        session.close();
        return;
      }

      boundAccountId = result.account.id;
      boundEnterpriseId = result.account.enterpriseId;
      throughput = result.account.throughput;

      await prisma.smppSession.create({
        data: {
          smppAccountId: result.account.id,
          bindType,
          clientIp: clientIp ?? undefined,
          isActive: true,
        },
      });

      session.send(bindResponse(pdu, 0));
    };

    session.on("bind_transceiver", (pdu) => void onBind(pdu, "transceiver"));
    session.on("bind_transmitter", (pdu) => void onBind(pdu, "transmitter"));
    session.on("bind_receiver", (pdu) => void onBind(pdu, "receiver"));

    session.on("submit_sm", (pdu) => {
      if (!boundAccountId) {
        session.send(pdu.response({ command_status: 0x0000000b }));
        return;
      }
      if (!allowThroughput(boundAccountId, throughput)) {
        session.send(pdu.response({ command_status: 0x00000058 }));
        return;
      }

      void (async () => {
        const account = await prisma.smppAccount.findUnique({
          where: { id: boundAccountId! },
          include: { enterprise: { include: { credit: true } } },
        });
        if (!account) {
          session.send(pdu.response({ command_status: 0x00000008 }));
          return;
        }

        const result = await handleSmppSubmit(account, {
          sourceAddr: pdu.source_addr ?? "SPLITSMS",
          destAddr: pdu.destination_addr ?? "",
          shortMessage: extractMessage(pdu),
          clientIp,
        });

        if (!result.ok) {
          session.send(pdu.response({ command_status: 0x00000051 }));
          return;
        }

        const msgId = result.messageId.slice(0, 64);
        session.send(pdu.response({ message_id: msgId }));
      })();
    });

    session.on("enquire_link", (pdu) => {
      session.send(pdu.response());
    });

    session.on("unbind", (pdu) => {
      session.send(pdu.response());
      session.close();
    });

    session.on("close", () => {
      if (boundAccountId) {
        void prisma.smppSession.updateMany({
          where: { smppAccountId: boundAccountId, isActive: true },
          data: { isActive: false, disconnectedAt: new Date() },
        });
      }
      if (boundAccountId) throughputBuckets.delete(boundAccountId);
    });
  });

  server.listen(port, () => {
    console.log(`SMPP gateway listening on port ${port}`);
  });

  return server;
}

/** Emit delivery receipt to bound sessions (starter — logs only for now). */
export async function reconcileSmppDlr(providerRef: string, status: "DELIVERED" | "FAILED") {
  await updateMessageFromDlr(providerRef, status);
}
