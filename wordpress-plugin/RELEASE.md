# WordPress plugin release

## Source of truth

| Item | Location |
|------|----------|
| Version | `config/site.json` → `wordpressPlugin.version` |
| Changelog | `wordpress-plugin/splitsms/readme.txt` (`= x.y.z =` blocks) |
| Plugin source | `wordpress-plugin/splitsms/` |
| Public downloads | `public/wordpress-plugin/` |

Do **not** edit zips or `version.json` by hand. Run the release script after changing the plugin or version.

## Developer workflow (local → git → live)

1. Edit plugin code in `wordpress-plugin/splitsms/`.
2. Bump version in `config/site.json` (see `VERSIONING.md`).
3. Add a changelog entry in `readme.txt` for that version.
4. Build release artifacts:

   ```bash
   npm run release:wp-plugin
   ```

   This writes `splitsms-{version}.zip`, `splitsms.zip`, and `version.json`, and removes old version zips.

5. Commit and push:

   - `wordpress-plugin/splitsms/`
   - `public/wordpress-plugin/`
   - `config/site.json`

6. Deploy the Next.js app (build runs `sync:site-config` via `prebuild`).

## Update live WordPress (after deploy)

Once splitsms.com is deployed with the new files:

### Automatic (recommended)

1. Log in to **WP Admin** on your live site.
2. Go to **Dashboard → Updates**.
3. Click **Check again** if needed, then **Update now** next to SplitSMS.

Or: **Plugins → Installed Plugins** → **Check for updates** (top of page).

Settings and API keys are preserved on update.

### Manual (fallback)

1. Download [splitsms.zip](https://splitsms.com/wordpress-plugin/splitsms.zip) (or the versioned zip from the integrations page).
2. **Plugins → Add New → Upload Plugin** → choose the zip → **Install Now** → **Replace current with uploaded**.

### Verify update endpoint

After deploy, these should show version **1.6.0** (or current in `config/site.json`):

- Manifest: `https://splitsms.com/api/plugin/update`
- Download: `https://splitsms.com/wordpress-plugin/splitsms.zip`

In the plugin: **SplitSMS → Help** shows installed version and update check URL.

## Local WordPress (Local by Flywheel)

Sync source to your local site without zipping:

```bash
npm run sync:wp-local
# or watch mode:
npm run watch:wp-local
```

Default path is configured in `scripts/sync-wp-local.mjs` (override with `SPLITSMS_WP_PLUGINS_DIR`).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No update shown on live WP | Confirm deploy finished; open `/api/plugin/update` in browser; click **Check again** on Updates screen |
| Wrong version after update | Ensure live site is not still using an old manually uploaded zip folder name |
| Stale zip in repo | Run `npm run release:wp-plugin` — old `splitsms-*.zip` files are deleted automatically |
