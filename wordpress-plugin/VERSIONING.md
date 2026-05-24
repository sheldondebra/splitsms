# SplitSMS WordPress plugin versioning

Version is defined once in **`config/site.json`** → `wordpressPlugin.version`.

Run after every change:

```bash
npm run sync:site-config
```

## Semver rules

| Change type | Example | When to bump |
|-------------|---------|--------------|
| **Patch** (fix) | 1.4.0 → **1.4.1** | Bug fixes, activation errors, hook fixes — no new settings keys |
| **Minor** (feature) | 1.4.0 → **1.5.0** | New integrations, UI sections, new option keys (merged on upgrade) |
| **Major** | 1.x → **2.0.0** | Breaking API or removed options |

## Build outputs

Each sync produces:

- `public/wordpress-plugin/splitsms-{version}.zip` — versioned download (used by WordPress update API)
- `public/wordpress-plugin/splitsms.zip` — latest alias (manual uploads / marketing links)

Update checker `download_url` points to the **versioned** zip so admins can see which build they installed.

## Settings on upgrade

Existing `splitsms_settings` are **never reset** on plugin update. New keys from `SplitSMS_Settings::defaults()` are merged in via `maybe_upgrade()` when the plugin version increases.

## Changelog

Add an entry to `wordpress-plugin/splitsms/readme.txt` under `== Changelog ==` before bumping the version.
