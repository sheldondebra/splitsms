import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const rows = await prisma.senderId.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      value: true,
      status: true,
      providerStatus: true,
      providerSubmittedAt: true,
      user: { select: { email: true } },
      createdAt: true,
    },
  });
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
