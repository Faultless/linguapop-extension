import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/dictionary/jlpt_estimator.dart';
import '../services/dictionary/jlpt_lookup.dart';
import 'tokenizer_provider.dart';

/// App-wide JLPT lookup, lazily loaded from bundled JSON assets.
final jlptLookupProvider = Provider<JlptLookup>((ref) => JlptLookup());

/// Watch this to know when the JLPT map is ready (the underlying lookup is
/// safe to call earlier but will return no hits until `load()` resolves).
/// Returns the entry count once loaded.
final jlptLoadedProvider = FutureProvider<int>((ref) async {
  final l = ref.watch(jlptLookupProvider);
  await l.load();
  return l.size;
});

/// App-wide difficulty estimator (tokenizer + JLPT table). Memoizes per-text,
/// so widgets can call `estimate` freely from build-adjacent code.
final jlptEstimatorProvider = Provider<JlptEstimator>((ref) => JlptEstimator(
      ref.watch(tokenizerProvider),
      ref.watch(jlptLookupProvider),
    ));
