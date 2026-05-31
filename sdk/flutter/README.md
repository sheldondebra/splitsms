# splitsms_flutter

Official SplitSMS Flutter/Dart SDK.

## Install

1. Download [splitsms-flutter.zip](https://www.splitsms.com/sdk/flutter/splitsms-flutter.zip)
2. Extract to `packages/splitsms_flutter` in your Flutter project
3. Add to `pubspec.yaml`:

```yaml
dependencies:
  splitsms_flutter:
    path: packages/splitsms_flutter
```

4. Run `flutter pub get`

## Usage

```dart
import 'package:splitsms_flutter/splitsms.dart';

final sms = SplitSMS(apiKey: apiKey, baseUrl: 'https://www.splitsms.com');

await sms.sendMessage(
  sender: 'MYBRAND',
  recipients: ['233201234567'],
  message: 'Hello',
);

sms.close();
```
