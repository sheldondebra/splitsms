import 'dart:convert';

import 'package:http/http.dart' as http;

import 'errors.dart';

/// Official SplitSMS Flutter SDK (starter).
/// @see https://www.splitsms.com/sdk
class SplitSMS {
  final String apiKey;
  final String baseUrl;
  final http.Client _http;

  SplitSMS({
    required this.apiKey,
    this.baseUrl = 'https://www.splitsms.com',
    http.Client? httpClient,
  }) : _http = httpClient ?? http.Client();

  Future<Map<String, dynamic>> sendMessage({
    String? sender,
    required List<String> recipients,
    required String message,
    String countryCode = 'GH',
  }) async {
    return _request('POST', '/api/v1/sms/send', {
      if (sender != null) 'sender': sender,
      'recipients': recipients,
      'message': message,
      'countryCode': countryCode,
    });
  }

  Future<Map<String, dynamic>> sendOtp(String phone, {String countryCode = 'GH'}) async {
    return _request('POST', '/api/v1/otp/send', {
      'phone': phone,
      'countryCode': countryCode,
    });
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String code) async {
    return _request('POST', '/api/v1/otp/verify', {
      'phone': phone,
      'code': code,
    });
  }

  Future<Map<String, dynamic>> walletBalance() async {
    return _request('GET', '/api/v1/wallet/balance');
  }

  Future<Map<String, dynamic>> accountBalance() async {
    return _request('GET', '/api/v1/balance');
  }

  Future<Map<String, dynamic>> listConnectCustomers({
    int? limit,
    String? externalRef,
  }) async {
    final q = <String, String>{};
    if (limit != null) q['limit'] = '$limit';
    if (externalRef != null) q['external_ref'] = externalRef;
    final query = q.isEmpty
        ? ''
        : '?${q.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
    return _request('GET', '/api/v1/connect/customers$query');
  }

  Future<Map<String, dynamic>> createConnectCustomer(Map<String, dynamic> body) async {
    return _request('POST', '/api/v1/connect/customers', body);
  }

  Future<Map<String, dynamic>> listSenderIds({String? customerId}) async {
    final q = customerId != null ? '?customer_id=${Uri.encodeComponent(customerId)}' : '';
    return _request('GET', '/api/v1/sender-ids$q');
  }

  Future<Map<String, dynamic>> registerSenderId(Map<String, dynamic> body) async {
    return _request('POST', '/api/v1/sender-ids', body);
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, [
    Map<String, dynamic>? body,
  ]) async {
    final uri = Uri.parse('${baseUrl.replaceAll(RegExp(r'/+$'), '')}$path');
    final headers = {
      'Authorization': 'Bearer $apiKey',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    late http.Response res;
    if (method == 'GET') {
      res = await _http.get(uri, headers: headers);
    } else {
      res = await _http.post(uri, headers: headers, body: jsonEncode(body ?? {}));
    }

    final data = jsonDecode(res.body);
    final map = data is Map<String, dynamic> ? data : <String, dynamic>{};

    if (res.statusCode < 200 || res.statusCode >= 300) {
      final err = map['error'];
      final msg = err is Map ? (err['message']?.toString() ?? 'Request failed') : 'Request failed';
      final code = err is Map ? err['code']?.toString() : null;
      throw SplitSMSError(msg, code: code, status: res.statusCode);
    }

    return map;
  }

  void close() => _http.close();
}
