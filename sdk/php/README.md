# splitsms/sdk (PHP)

Official SplitSMS PHP SDK.

## Install via Composer (hosted on SplitSMS)

```bash
composer config repositories.splitsms composer https://www.splitsms.com/sdk/php/
composer require splitsms/sdk
```

## Manual zip

Download [splitsms-sdk.zip](https://www.splitsms.com/sdk/php/splitsms-sdk.zip), extract, and add as a path repository.

## Usage

```php
<?php
require 'vendor/autoload.php';

use SplitSMS\Client;

$client = new Client(getenv('SPLITSMS_API_KEY'), 'https://www.splitsms.com');

$client->sms()->send([
    'sender' => 'MYBRAND',
    'recipients' => ['233201234567'],
    'message' => 'Hello from SplitSMS',
]);
```

Requires PHP 7.4+, ext-json, ext-curl.
