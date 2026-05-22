import Link from "next/link";

export default function DevelopersDocsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API documentation</h1>
      <p className="text-sm text-muted-foreground">
        Full reference with examples, error codes, rate limits, and webhooks.
      </p>
      <Link href="/api-docs" className="text-primary font-medium hover:underline">
        Open full API docs →
      </Link>
    </div>
  );
}
