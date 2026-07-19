import '../../data/models/jp_token.dart';

/// Post-processing pass over raw MeCab output that merges a verb/adjective
/// stem with the auxiliary chain conjugated onto it, producing one token per
/// grammatical phrase instead of one per morpheme.
///
///   食べ / て / い / まし / た   →   食べていました
///     (base 食べる, forms: progressive · polite · past)
///
/// This keeps JLPT coloring on the dictionary form of the actual verb, makes
/// tap-for-dictionary hit the right headword, and lets the popover explain
/// which conjugation the reader is looking at.
///
/// The merged surfaces always concatenate to exactly the original text, so
/// render-time span building is unaffected.
class ConjugationMerger {
  /// Merge conjugation chains in [tokens]. Tokens not part of a chain pass
  /// through unchanged.
  static List<JpToken> merge(List<JpToken> tokens) {
    final out = <JpToken>[];
    var i = 0;
    while (i < tokens.length) {
      final head = tokens[i];
      if (!_isChainHead(head)) {
        out.add(head);
        i++;
        continue;
      }
      // Absorb the auxiliary chain.
      final chain = <JpToken>[head];
      var j = i + 1;
      while (j < tokens.length && _continuesChain(tokens[j], chain)) {
        chain.add(tokens[j]);
        j++;
      }
      out.add(_fuse(chain));
      i = j;
    }
    return out;
  }

  static bool _posStartsWith(JpToken t, String prefix) =>
      t.pos == prefix || t.pos.startsWith('$prefix,');

  /// Heads: independent verbs and adjectives (自立), including ない as an
  /// independent adjective (お金がない).
  static bool _isChainHead(JpToken t) {
    if (t.isFiller) return false;
    return _posStartsWith(t, '動詞,自立') || _posStartsWith(t, '形容詞,自立');
  }

  /// Connector particles that glue the chain together (te-form and friends,
  /// plus the ば conditional).
  static const _connectorSurfaces = {'て', 'で', 'ちゃ', 'じゃ', 'ば'};

  static bool _continuesChain(JpToken t, List<JpToken> chain) {
    if (t.isFiller) return false;
    if (_posStartsWith(t, '助動詞')) return true;
    if (_posStartsWith(t, '動詞,接尾')) return true;
    if (_posStartsWith(t, '動詞,非自立')) return true;
    if (_posStartsWith(t, '形容詞,非自立')) return true;
    if (_posStartsWith(t, '形容詞,接尾')) return true;
    if (_posStartsWith(t, '助詞,接続助詞') &&
        _connectorSurfaces.contains(t.surface)) {
      return true;
    }
    return false;
  }

  static JpToken _fuse(List<JpToken> chain) {
    final head = chain.first;
    if (chain.length == 1) {
      // Single morpheme — only annotate the standalone notable forms.
      final label = _headFormLabel(head);
      if (label == null) return head;
      return head.copyWith(
        conjugation: ConjugationInfo(
          forms: [label],
          parts: [
            ConjPart(surface: head.surface, base: head.base, role: 'stem'),
          ],
        ),
      );
    }

    final surface = chain.map((t) => t.surface).join();
    final reading = chain.every((t) => t.reading != null)
        ? chain.map((t) => t.reading).join()
        : null;

    final parts = <ConjPart>[
      ConjPart(surface: head.surface, base: head.base, role: 'stem'),
    ];
    final forms = <String>[];

    void addForm(String f) {
      if (f.isNotEmpty && (forms.isEmpty || forms.last != f)) forms.add(f);
    }

    final headLabel = _headFormLabel(head);
    if (headLabel != null) addForm(headLabel);

    for (var k = 1; k < chain.length; k++) {
      final t = chain[k];
      final next = k + 1 < chain.length ? chain[k + 1] : null;
      final role = _roleFor(t, head, next);
      parts.add(ConjPart(surface: t.surface, base: t.base, role: role));
      // A connector て followed by a helper verb is subsumed by that helper's
      // label (ている = progressive, not "te-form + progressive").
      final isSubsumedConnector = _posStartsWith(t, '助詞,接続助詞') &&
          (t.surface == 'て' || t.surface == 'で' || t.surface == 'ちゃ' || t.surface == 'じゃ') &&
          next != null;
      if (!isSubsumedConnector && role.isNotEmpty) addForm(role);
    }

    return JpToken(
      surface: surface,
      base: head.base,
      reading: reading,
      pos: head.pos,
      isFiller: false,
      inflectionType: head.inflectionType,
      inflectionForm: head.inflectionForm,
      conjugation: ConjugationInfo(forms: forms, parts: parts),
    );
  }

  /// Notable forms carried by the head morpheme's own 活用形.
  static String? _headFormLabel(JpToken head) {
    switch (head.inflectionForm) {
      case '命令ｅ':
      case '命令ｉ':
      case '命令ｒｏ':
      case '命令ｙｏ':
      case '命令形':
        return 'imperative';
      default:
        return null;
    }
  }

  /// Grammatical role of one auxiliary in the chain.
  static String _roleFor(JpToken t, JpToken head, JpToken? next) {
    final base = t.base;
    final surface = t.surface;

    if (_posStartsWith(t, '助動詞')) {
      switch (base) {
        case 'た':
        case 'だ':
          // たら / だら — the conditional use of た (仮定形).
          if (surface == 'たら' || surface == 'だら' || t.inflectionForm == '仮定形') {
            return 'conditional (tara)';
          }
          return 'past';
        case 'ます':
          return 'polite';
        case 'ない':
        case 'ぬ':
        case 'ん':
          return 'negative';
        case 'う':
        case 'よう':
          return 'volitional';
        case 'まい':
          return 'negative volitional';
        case 'たい':
          return 'desiderative (want to)';
        case 'らしい':
          return 'hearsay (seems)';
        case 'です':
          return 'polite';
        case 'べし':
          return 'should';
        case 'そうだ':
          return 'appearance (looks like)';
      }
      return '';
    }

    if (_posStartsWith(t, '動詞,接尾')) {
      switch (base) {
        case 'れる':
          return 'passive';
        case 'られる':
          // For 一段 verbs られる is also the potential form.
          final ichidan = head.inflectionType?.startsWith('一段') ?? false;
          return ichidan ? 'passive / potential' : 'passive';
        case 'せる':
        case 'させる':
          return 'causative';
        case 'がる':
          return 'outward sign (~garu)';
      }
      return '';
    }

    if (_posStartsWith(t, '動詞,非自立')) {
      switch (base) {
        case 'いる':
        case 'てる':
          return 'progressive (ている)';
        case 'ある':
          return 'resultative (てある)';
        case 'おく':
        case 'とく':
          return 'preparatory (ておく)';
        case 'しまう':
        case 'ちゃう':
        case 'じゃう':
          return 'completive (てしまう)';
        case 'みる':
          return 'attemptive (てみる)';
        case 'いく':
        case '行く':
          return 'progressing away (ていく)';
        case 'くる':
        case '来る':
          return 'progressing toward (てくる)';
        case 'もらう':
        case 'いただく':
        case '頂く':
          return 'benefactive (receive)';
        case 'くれる':
        case 'くださる':
        case '下さる':
          return 'benefactive (done for me)';
        case 'あげる':
        case 'やる':
        case 'さしあげる':
          return 'benefactive (give)';
        case '始める':
        case 'はじめる':
          return 'inchoative (start to)';
        case '続ける':
        case 'つづける':
          return 'continuative (keep on)';
        case '出す':
        case 'だす':
          return 'sudden start (~dasu)';
        case '過ぎる':
        case 'すぎる':
          return 'excessive (too much)';
        case 'なる':
          return 'become';
        case 'できる':
          return 'potential';
      }
      return '';
    }

    if (_posStartsWith(t, '形容詞,非自立') || _posStartsWith(t, '形容詞,接尾')) {
      switch (base) {
        case 'ほしい':
        case '欲しい':
          return 'desiderative (てほしい)';
        case 'やすい':
          return 'facilitative (easy to)';
        case 'にくい':
        case 'がたい':
          return 'difficult to';
        case 'ない':
          return 'negative';
        case 'よい':
        case 'いい':
          return 'permissive (てもいい)';
      }
      return '';
    }

    if (_posStartsWith(t, '助詞,接続助詞')) {
      switch (surface) {
        case 'て':
        case 'で':
          return 'te-form';
        case 'ちゃ':
        case 'じゃ':
          return 'contracted te-form';
        case 'ば':
          return 'conditional (ba)';
      }
      return '';
    }

    return '';
  }
}
