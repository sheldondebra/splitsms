import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Tag } from "lucide-react";
import type { BlogPost } from "@/lib/marketing/blog-posts";
import { blogPosts } from "@/lib/marketing/blog-posts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BlogPostContent({ post }: { post: BlogPost }) {
  const others = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <article className="bg-background">
      <header className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-10 md:pt-14">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">
              <Tag className="h-3 w-3" />
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readTime}
            </span>
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {post.sections.map((section, i) => (
            <section key={i}>
              {section.heading && (
                <h2 className="text-xl font-semibold mb-3 text-foreground">{section.heading}</h2>
              )}
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 text-center">
          <h2 className="text-lg font-semibold">Try SplitSMS free</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Send bulk SMS, OTP, and campaigns — 5 free credits on signup.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={cn(buttonVariants(), "font-semibold gap-2")}>
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/features" className={cn(buttonVariants({ variant: "outline" }))}>
              See features
            </Link>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <aside className="border-t border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              More articles
            </h2>
            <ul className="mt-4 space-y-3">
              {others.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-foreground font-medium hover:text-primary transition-colors"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </article>
  );
}
