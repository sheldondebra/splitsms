import Link from "next/link";
import { ArrowRight, Clock, Newspaper, Tag } from "lucide-react";
import { getFeaturedBlogPosts } from "@/lib/marketing/blog-posts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeBlogSection() {
  const posts = getFeaturedBlogPosts(3);

  return (
    <section className="py-20 border-t bg-background" aria-labelledby="home-blog-heading">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary inline-flex items-center gap-2">
              <Newspaper className="h-4 w-4" aria-hidden />
              SplitSMS Blog
            </p>
            <h2 id="home-blog-heading" className="mt-2 text-3xl font-bold tracking-tight">
              SMS tips, guides & stories
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Practical bulk SMS advice for Ghana and Africa — marketing playbooks, API guides,
              compliance, and real business stories.
            </p>
          </div>
          <Link
            href="/blog"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "shrink-0 rounded-xl font-semibold gap-2 border-primary/30 hover:border-primary",
            )}
          >
            View all articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">
                  <Tag className="h-3 w-3" />
                  {post.category}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
              >
                Read more
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl font-semibold gap-2")}
          >
            View all articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </p>
      </div>
    </section>
  );
}
