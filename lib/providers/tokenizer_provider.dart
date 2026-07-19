import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/tokenizer/jp_token_cache.dart';
import '../services/tokenizer/jp_tokenizer.dart';
import '../services/tokenizer/tokenizer_factory.dart';

/// Singleton tokenizer for the app. Eagerly created (cheap, no I/O) but lazy
/// to initialize — call `tokenizerProvider.read().init()` to warm it up.
final tokenizerProvider = Provider<JpTokenizer>((ref) {
  return createJpTokenizer();
});

/// Watches the tokenizer's [TokenizerStatus]. Kicks off initialization on
/// first read and rebuilds when init finishes (or fails). Use in widgets that
/// want to show a tokenizing/loading shimmer.
final tokenizerStatusProvider =
    FutureProvider<TokenizerStatus>((ref) async {
  final t = ref.watch(tokenizerProvider);
  await t.init();
  return t.status;
});

/// App-wide token cache. Reused across reader rebuilds so scrolling doesn't
/// re-FFI MeCab for already-seen paragraphs.
final jpTokenCacheProvider = Provider<JpTokenCache>((ref) => JpTokenCache());
