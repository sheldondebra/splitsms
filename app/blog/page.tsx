import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { BlogListContent } from "@/components/marketing/blog-list-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { getSortedBlogPosts } from "@/lib/marketing/blog-posts";
import { blogIndexMetadata } from "@/lib/seo/marketing-metadata";
import { blogCollectionJsonLd, breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = blogIndexMetadata;

export default function BlogPage() {
  const posts = getSortedBlogPosts();

  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          webPageJsonLd({
            name: "SplitSMS Blog",
            description:
              "Bulk SMS marketing tips, OTP API guides, WooCommerce SMS, and integration tutorials.",
            path: "/blog",
          }),
          blogCollectionJsonLd(
            posts.map((post) => ({
              title: post.title,
              path: `/blog/${post.slug}`,
              datePublished: post.published,
            })),
          ),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />
      <BlogListContent />
    </MarketingPageShell>
  );
}
