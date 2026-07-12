import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { BlogPostContent } from "@/components/marketing/blog-post-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getAllBlogSlugs, getBlogPost } from "@/lib/marketing/blog-posts";
import {
  articleJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Article not found" };

  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    keywords: post.keywords,
    ogType: "article",
    publishedTime: post.published,
    modifiedTime: post.updated ?? post.published,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const path = `/blog/${slug}`;

  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          articleJsonLd({
            title: post.title,
            description: post.excerpt,
            path,
            datePublished: post.published,
            dateModified: post.updated ?? post.published,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path },
          ]),
        ]}
      />
      <BlogPostContent post={post} />
    </MarketingPageShell>
  );
}
