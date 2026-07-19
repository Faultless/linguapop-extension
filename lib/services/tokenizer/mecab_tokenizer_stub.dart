import '../../data/models/jp_token.dart';
import 'jp_tokenizer.dart';

/// Web stub: MeCab depends on FFI which isn't available in Flutter web.
/// Returns the whole text as a single filler token; the JLPT colorizer falls
/// back to "no highlights" and the dictionary popover still works on tap-and-
/// hold of the entire span. A future iteration could load kuromoji.js via
/// JS interop here.
class _StubTokenizer implements JpTokenizer {
  @override
  TokenizerStatus get status => TokenizerStatus.ready;

  @override
  Future<void> init() async {}

  @override
  List<JpToken> tokenize(String text) => JpTokenizer.degraded(text);
}

JpTokenizer createTokenizer() => _StubTokenizer();
