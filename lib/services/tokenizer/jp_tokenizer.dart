import '../../data/models/jp_token.dart';

/// Status of the lazily-loaded JP tokenizer pipeline.
enum TokenizerStatus { idle, loading, ready, failed }

/// Single source of truth for Japanese tokenization. The native implementation
/// (Android/Linux/Desktop) uses MeCab via FFI; web uses a stub that returns
/// the input as one surface-only token. Either way, callers depend only on
/// this interface.
abstract class JpTokenizer {
  TokenizerStatus get status;

  /// One-time setup. Safe to call multiple times — implementations should
  /// memoize. Returns when [status] is either `ready` or `failed`.
  Future<void> init();

  /// Splits the input into morphemes. On failure the implementation must fall
  /// back to a single surface-only token so callers can always render the text.
  List<JpToken> tokenize(String text);

  /// Backstop tokenizer that just returns the text as one filler-flagged token.
  /// Useful as a render-time fallback while the real tokenizer is still loading.
  static List<JpToken> degraded(String text) =>
      text.isEmpty ? const [] : [JpToken(surface: text, base: text, isFiller: true)];
}
