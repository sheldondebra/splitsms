import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHero({ title, description, children, className }: PageHeroProps) {
  return (
    <section
      className={cn(
        "hero-gradient relative overflow-hidden text-white py-16 md:py-20 text-center",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.72_0.19_45/0.12),transparent_55%)]" />
      <div className="relative mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {description && (
          <p className="mt-4 text-base md:text-lg text-white/65 leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    </section>
  );
}
