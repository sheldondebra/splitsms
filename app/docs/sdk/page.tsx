import type { Metadata } from "next";
import { DocsSubpage } from "@/components/marketing/docs-subpage";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SDKs — SplitSMS",
  description: "JavaScript, PHP, and mobile SDK guides for SplitSMS Connect.",
};

export default function DocsSdkPage() {
  return (
    <DocsSubpage
      title="SDKs"
      description="Official SDKs and code samples for integrating SplitSMS without hand-rolling HTTP."
    >
      <p>
        SDK documentation and copy-paste examples live on the{" "}
        <Link href="/sdk">SDK page</Link>. Languages covered:
      </p>
      <ul>
        <li>JavaScript / TypeScript (fetch & Node)</li>
        <li>PHP (WordPress plugin uses the same REST surface)</li>
        <li>Flutter / mobile HTTP patterns</li>
      </ul>
      <p>
        All SDKs target <code>/api/v1</code> with Bearer authentication. Sandbox keys are
        available for testing without debiting live credits.
      </p>
    </DocsSubpage>
  );
}
