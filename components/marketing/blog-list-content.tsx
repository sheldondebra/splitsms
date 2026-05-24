import Link from "next/link";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { getBlogCategories, getSortedBlogPosts } from "@/lib/marketing/blog-posts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BlogListContent() {
  const sorted = getSortedBlogPosts();
  const categories = getBlogCategories();

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 via-background to-background">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.72_0.19_45/0.1),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-20 md:pb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">SplitSMS Blog</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:max-w-2xl">
            SMS insights for Ghana & growing businesses
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl leading-relaxed">
            Learn why bulk SMS matters, how to choose a gateway, and how SplitSMS helps you
            reach customers — without the enterprise headache.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            <strong className="text-foreground">{sorted.length}</strong> articles · SMS marketing,
            guides, integrations & business stories
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-background">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            {sorted.map((post, i) => (
              <article
                key={post.slug}
                className={cn(
                  "group rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-sm transition-all hover:border-primary/30 hover:shadow-md",
                  i === 0 && "md:col-span-2 md:grid md:grid-cols-[1.2fr_1fr] md:gap-8 md:items-center",
                )}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">
                      <Tag className="h-3 w-3" />
                      {post.category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                    <time dateTime={post.published}>
                      {new Date(post.published).toLocaleDateString("en-GH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <h2
                    className={cn(
                      "mt-4 font-bold tracking-tight group-hover:text-primary transition-colors",
                      i === 0 ? "text-2xl md:text-3xl" : "text-xl",
                    )}
                  >
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
                <div className={cn("mt-6", i === 0 && "md:mt-0 md:flex md:justify-end")}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
                  >
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold">Ready to send bulk SMS?</h2>
          <p className="mt-3 text-muted-foreground">
            5 free credits · Ghana from GHS 0.029 · API & dashboard included
          </p>
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "lg" }), "mt-6 font-semibold gap-2")}
          >
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
