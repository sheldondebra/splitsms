# Search Console SEO tooling

Verify `https://www.splitsms.com/` in Google Search Console, then pull opportunity-ranked query/page data with the CLI.

## 1. Create the property

1. Open [Google Search Console](https://search.google.com/search-console) → **Add property**.
2. Choose **URL prefix**: `https://www.splitsms.com`.
3. Pick verification methods (**HTML tag** and **HTML file** — use both).

## 2. Meta tag verification

1. Copy the content token from Search Console (the `content="…"` value only).
2. Set in production (and local `.env` if testing):

```bash
GOOGLE_SITE_VERIFICATION=your_token_here
```

The app already emits this via `googleSiteVerification()` in `app/layout.tsx`.

3. Deploy so `https://www.splitsms.com` serves the meta tag.

## 3. HTML file verification

1. Download the `googleXXXXXXXX.html` file from Search Console.
2. Install it:

```bash
npm run seo:install-verification -- ~/Downloads/googleXXXXXXXX.html
```

3. Deploy, confirm `https://www.splitsms.com/googleXXXXXXXX.html` loads, then click **Verify**.

## 4. Submit the sitemap

In Search Console → Sitemaps, submit:

`https://www.splitsms.com/sitemap.xml`

## 5. Enable the API + ADC (`gcloud`)

```bash
gcloud services enable searchconsole.googleapis.com --project=splitsms

gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/webmasters.readonly
```

Your Google account must be an owner/full user on the Search Console property.

## 6. Run the opportunity report

```bash
npm run seo:gsc-report
# optional:
GSC_SITE_URL=https://www.splitsms.com/ npm run seo:gsc-report -- --days=28
```

Writes `scripts/seo/out/gsc-report.json` (gitignored) and prints top opportunities.

**Note:** New properties often return empty analytics for a few days after verification.

## 7. Optimize (Phase B)

For each top opportunity URL/query:

1. Title + meta description (CTR)
2. H1 / intro alignment
3. Internal links from related solutions / blog / pricing / docs
4. Content gaps only where the page under-answers the query

Re-run the report after deploy to watch CTR and position.
