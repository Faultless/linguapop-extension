import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/translation/translate_service.dart';

final translateServiceProvider = Provider<TranslateService>((ref) {
  final s = TranslateService();
  ref.onDispose(s.close);
  return s;
});
