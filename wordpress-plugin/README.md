# SplitSMS WordPress Plugin

Official plugin for [www.splitsms.com](https://www.splitsms.com).

## Download

- **Live site:** [https://www.splitsms.com/integrations](https://www.splitsms.com/integrations)
- **Direct zip:** [https://www.splitsms.com/wordpress-plugin/splitsms.zip](https://www.splitsms.com/wordpress-plugin/splitsms.zip)

## Updates

WordPress checks `https://www.splitsms.com/api/plugin/update` for new versions. When you bump the version in `config/site.json` and run `npm run sync:site-config`, all connected sites see the update in **Plugins → Updates**.

## Developer sync

Canonical URLs live in **`config/site.json`**. Run:

```bash
npm run sync:site-config
```

This regenerates:

- `wordpress-plugin/splitsms/includes/splitsms-config.php`
- `public/wordpress-plugin/version.json`
- `public/wordpress-plugin/splitsms.zip`
- Postman collection `baseUrl`

## Configure in WordPress

1. Install plugin (upload zip).
2. **Settings → SplitSMS**
3. API base URL: `https://www.splitsms.com` (pre-filled on new installs)
4. API key from your SplitSMS dashboard
5. Enable WooCommerce / WordPress / form events as needed
