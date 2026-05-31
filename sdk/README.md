# SplitSMS SDKs

Official client libraries for [www.splitsms.com/sdk](https://www.splitsms.com/sdk).

Packages are **hosted on SplitSMS** — install without npm, Packagist, or pub.dev:

| SDK | Install | Folder |
|-----|---------|--------|
| JavaScript / Node | `npm install https://www.splitsms.com/sdk/javascript/splitsms-sdk.tgz` | `javascript/` |
| PHP | `composer config repositories.splitsms composer https://www.splitsms.com/sdk/php/` then `composer require splitsms/sdk` | `php/` |
| Flutter | Download zip from `/sdk/flutter/`, path dependency | `flutter/` |

Build and publish artifacts from repo root:

```bash
npm run sync:sdks
```

## Features (v1.1.0)

- Send SMS, OTP send/verify, wallet balance
- Connect customer provisioning
- Sender ID registration
- Campaign list (JS)

See [SDK page](https://www.splitsms.com/sdk) for copy-paste examples.
