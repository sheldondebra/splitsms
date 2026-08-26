import { createOgImageResponse, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-image";
import { getBlogPost } from "@/lib/marketing/blog-posts";

export const alt = "SplitSMS blog article";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function BlogOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  return createOgImageResponse({
    kicker: "Blog",
    title: post?.title ?? "SplitSMS Blog",
    subtitle: post?.excerpt ?? "Guides for bulk SMS, OTP APIs, and messaging in Ghana.",
  });
}
