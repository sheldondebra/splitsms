class SplitSMSError implements Exception {
  final String message;
  final String? code;
  final int? status;

  SplitSMSError(this.message, {this.code, this.status});

  @override
  String toString() => 'SplitSMSError: $message';
}
