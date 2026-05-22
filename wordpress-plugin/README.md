# SplitSMS WordPress Plugin

Zip `splitsms/` for WordPress upload, or copy the folder to `wp-content/plugins/splitsms/`.

Pre-built zip for download from the app: `/wordpress-plugin/splitsms.zip` (generated into `public/wordpress-plugin/`).

## Configure in WordPress

**Settings → SplitSMS**

- API base URL — your SplitSMS app URL (e.g. `https://app.example.com`)
- API key — from **Developers → API Keys**
- Sender ID — must match an approved sender in your account
- Enable only the events you need (WooCommerce, registration, forms, etc.)

## Suggested preferences

| Use case | Enable |
|----------|--------|
| E-commerce store | WooCommerce order placed + payment complete + completed |
| High-volume shop | Turn off “order placed”; keep payment + completed only |
| Membership site | WordPress new user registration |
| Lead forms | Contact Form 7 or WPForms + set phone field name |
