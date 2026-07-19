import 'dart:async';

import 'package:mecab_dart/mecab_dart.dart';

import '../../data/models/jp_token.dart';
import 'conjugation_merger.dart';
import 'jp_tokenizer.dart';

const _ipadicAssetDir = 'assets/ipadic';

/// MeCab-backed tokenizer. Lazy: dictionary is copied from Flutter assets to
/// the app's document directory on first init (~51MB; once-per-install cost).
/// All `tokenize` calls after `init` complete are synchronous via FFI.
class MecabTokenizer implements JpTokenizer {
  Mecab? _mecab;
  TokenizerStatus _status = TokenizerStatus.idle;
  Future<void>? _initFuture;

  @override
  TokenizerStatus get status => _status;

  @override
  Future<void> init() {
    if (_initFuture != null) return _initFuture!;
    _initFuture = _doInit();
    return _initFuture!;
  }

  Future<void> _doInit() async {
    _status = TokenizerStatus.loading;
    try {
      final m = Mecab();
      await m.init(_ipadicAssetDir, true);
      _mecab = m;
      _status = TokenizerStatus.ready;
    } catch (_) {
      _status = TokenizerStatus.failed;
    }
  }

  @override
  List<JpToken> tokenize(String text) {
    final m = _mecab;
    if (m == null) return JpTokenizer.degraded(text);
    if (text.isEmpty) return const [];

    final nodes = m.parse(text);
    final out = <JpToken>[];
    for (final n in nodes) {
      // MeCab emits an EOS node at the end with empty features — skip it,
      // and skip nodes whose surface is empty (defensive).
      if (n.surface.isEmpty || n.features.isEmpty) continue;
      if (n.features.first == 'BOS/EOS') continue;

      final pos = _composePos(n.features);
      final base = _feature(n.features, 6) ?? n.surface;
      final readingKana = _feature(n.features, 7);
      final reading =
          readingKana != null ? _katakanaToHiragana(readingKana) : null;
      final filler = _isFiller(n.features);

      out.add(JpToken(
        surface: n.surface,
        base: base,
        reading: reading,
        pos: pos,
        isFiller: filler,
        inflectionType: _feature(n.features, 4),
        inflectionForm: _feature(n.features, 5),
      ));
    }
    return ConjugationMerger.merge(out);
  }

  static String _composePos(List<String> features) {
    // IPADIC features: pos1, pos2, pos3, pos4, inflection-form, inflection-type,
    //                  base form, reading, pronunciation
    final upTo4 = features.take(4).where((s) => s != '*').toList();
    return upTo4.join(',');
  }

  static String? _feature(List<String> features, int idx) {
    if (idx >= features.length) return null;
    final v = features[idx];
    if (v.isEmpty || v == '*') return null;
    return v;
  }

  static bool _isFiller(List<String> features) {
    if (features.isEmpty) return true;
    final pos1 = features[0];
    // Symbols, whitespace, BOS/EOS markers → don't try to colorize.
    return pos1 == '記号' || pos1 == 'BOS/EOS' || pos1 == '空白';
  }

  /// Subtract 0x60 from chars in the katakana range to get the hiragana equivalent.
  /// Leaves anything else unchanged (handles katakana extension chars like ヴ, ヶ).
  static String _katakanaToHiragana(String s) {
    final buf = StringBuffer();
    for (final r in s.runes) {
      if (r >= 0x30A1 && r <= 0x30F6) {
        buf.writeCharCode(r - 0x60);
      } else {
        buf.writeCharCode(r);
      }
    }
    return buf.toString();
  }
}

JpTokenizer createTokenizer() => MecabTokenizer();
