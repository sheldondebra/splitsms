# Deploy SplitSMS on Vercel

## Why you might see the default Next.js page

That screen comes from the **first** `create-next-app` commit. Your SplitSMS landing page is in commit `6ce91fa` (`app/page.tsx`). Vercel keeps serving the **last successful** deployment — if newer builds failed, the old default page stays live.

## Fix (5 minutes)

### 1. Production branch

Repo uses **`master`**, not `main`.

In Vercel: **Project → Settings → Git → Production Branch** → set to **`master`**.

### 2. Root directory

**Settings → General → Root Directory** → leave **empty** (project root must contain `app/page.tsx` and `package.json`).

### 3. Environment variables

**Settings → Environment Variables** (Production + Preview):

| Variable | Required |
|----------|----------|
| `DATABASE_URL` | Yes (Neon Postgres URL) |
| `SESSION_SECRET` | Yes (long random string) |
| `NEXT_PUBLIC_APP_URL` | Yes (`https://your-domain.vercel.app`) |
| `REDIS_URL` | For queues (optional on Vercel serverless) |
| `PAYSTACK_SECRET_KEY` | For wallet top-up |
| `PAYSTACK_PUBLIC_KEY` | For wallet top-up |

### 4. Redeploy

**Deployments** → latest → **Redeploy** (or push a new commit).

Build command (in `vercel.json`): `prisma generate && next build`

### 5. Confirm

Open `https://your-app.vercel.app/` — you should see **“Engage customers with intelligent bulk SMS”**, not the Next.js logo template.

## Push latest code

Many fixes are only on your machine until you commit and push:

```bash
git add .
git commit -m "Fix Vercel build and landing deploy"
git push origin master
```

## Workers

SMS workers (`npm run worker:sms`) do **not** run on Vercel. Host them on Railway, Render, or a VPS with the same `DATABASE_URL` and `REDIS_URL`.
