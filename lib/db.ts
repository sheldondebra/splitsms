import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pool: Pool;
};

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = globalForPrisma.pool ?? new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;
  return client;
}

/** Dev hot-reload can keep an old Prisma client missing newer models — recreate if stale */
function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && typeof cached.authAttempt !== "undefined") {
    return cached;
  }
  const client = createPrisma();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrisma();
