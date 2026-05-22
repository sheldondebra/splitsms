import "dotenv/config";
import { startSmppGateway } from "@/lib/smpp/gateway";

const port = Number(process.env.SMPP_PORT ?? 2775);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set — SMPP gateway exiting");
  process.exit(1);
}

startSmppGateway(port);
