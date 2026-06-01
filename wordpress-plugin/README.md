# SplitSMS WordPress plugin

Source lives in `splitsms/`. Releases are built from the repo root.

## Release commands

| Command | Use when |
|---------|----------|
| `npm run release:wp-plugin` | Deploying zips to **splitsms.com** (one-click update + reinstall from cloud) |
| `npm run release:wp-plugin-org` | Preparing code for **WordPress.org SVN** (no external update UI) |
| `npm run validate:wp-plugin` | Checking versions, readme, and zip layout without rebuilding |

After `release:wp-plugin`, artifacts are in `public/wordpress-plugin/`:

- `SplitSMS-v{version}.zip` — versioned download
- `splitsms.zip` — latest alias

## WordPress.org SVN

1. Run `npm run release:wp-plugin-org`.
2. Copy `wordpress-plugin/splitsms/` into your SVN checkout (do not commit the splitsms.com zip as the directory plugin).
3. Run `npm run release:wp-plugin` again so site downloads use the splitsms.com build (`SPLITSMS_ALLOW_CLOUD_PACKAGES` true).

## Manual smoke test

1. **Plugins → Add New → Upload** → `SplitSMS-v{version}.zip`
2. **Activate** — no critical error
3. **SplitSMS → Settings** — API key → **Test connection**
4. **SplitSMS → Dashboard** — **Send test SMS**

## Config

Version and download URLs come from `config/site.json` → `wordpressPlugin`. Do not edit `includes/splitsms-config.php` by hand; run `npm run sync:site-config`.
