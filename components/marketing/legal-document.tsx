type LegalSection = {
  title: string;
  body: string[];
};

export function LegalDocument({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <header className="mb-10 pb-8 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
        <p className="mt-4 text-muted-foreground leading-relaxed">{intro}</p>
      </header>
      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
            <div className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
