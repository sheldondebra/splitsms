import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribed",
  robots: { index: false, follow: false },
};

export default function EmailMarketingUnsubscribedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
