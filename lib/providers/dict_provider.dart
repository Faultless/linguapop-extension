import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/dictionary/jisho_service.dart';
import 'jlpt_provider.dart';

final jishoServiceProvider = Provider<JishoService>(
  (ref) => JishoService(ref.read(jlptLookupProvider)),
);
