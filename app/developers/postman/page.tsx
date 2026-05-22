import { PostmanPanel } from "@/components/developers/postman-panel";
import { headers } from "next/headers";

export default async function DevelopersPostmanPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6C37] mb-2">
          Postman
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Test the API in Postman</h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-xl">
          Import our collection, set your API key, and run requests without writing curl commands.
        </p>
      </div>
      <PostmanPanel baseUrl={baseUrl} />
    </div>
  );
}
