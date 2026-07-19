import 'reader_prefs.dart' show JpPosCategory;

/// One morpheme of a merged conjugation chain — the verb stem or one of the
/// auxiliaries glued onto it (e.g. 食べ / て / い / まし / た).
class ConjPart {
  final String surface;
  final String base;
  /// What this part contributes grammatically ("stem", "te-form",
  /// "progressive", "polite", "past", …). Empty when unknown.
  final String role;
  const ConjPart({required this.surface, required this.base, this.role = ''});
}

/// Grammatical analysis of a conjugated verb/adjective phrase, attached to
/// the merged token by the conjugation merger.
class ConjugationInfo {
  /// Human-readable form labels in order, e.g. ["te-form", "progressive",
  /// "polite", "past"] for 食べていました.
  final List<String> forms;
  /// The morpheme breakdown of the whole phrase.
  final List<ConjPart> parts;
  const ConjugationInfo({required this.forms, required this.parts});

  /// e.g. "progressive · polite · past"
  String get summary => forms.join(' · ');
}

class JpToken {
  final String surface;
  final String base;
  final String? reading;
  final String pos;
  final bool isFiller;

  /// IPADIC 活用型 (conjugation type, e.g. 一段, 五段・ラ行) of the head
  /// morpheme, when applicable.
  final String? inflectionType;

  /// IPADIC 活用形 (conjugation form, e.g. 連用形, 未然形) of the head
  /// morpheme, when applicable.
  final String? inflectionForm;

  /// Set when this token is a merged conjugated phrase (verb/adjective stem +
  /// auxiliary chain). Null for plain single-morpheme tokens.
  final ConjugationInfo? conjugation;

  const JpToken({
    required this.surface,
    required this.base,
    this.reading,
    this.pos = '',
    this.isFiller = false,
    this.inflectionType,
    this.inflectionForm,
    this.conjugation,
  });

  JpPosCategory get posCategory => classifyJpPos(pos);

  JpToken copyWith({
    String? surface,
    String? base,
    String? reading,
    String? pos,
    bool? isFiller,
    String? inflectionType,
    String? inflectionForm,
    ConjugationInfo? conjugation,
  }) {
    return JpToken(
      surface: surface ?? this.surface,
      base: base ?? this.base,
      reading: reading ?? this.reading,
      pos: pos ?? this.pos,
      isFiller: isFiller ?? this.isFiller,
      inflectionType: inflectionType ?? this.inflectionType,
      inflectionForm: inflectionForm ?? this.inflectionForm,
      conjugation: conjugation ?? this.conjugation,
    );
  }
}

/// Map a raw kuromoji / IPADIC top-level POS tag (e.g. '名詞,固有名詞,...') to a
/// coarse highlighter category. Matches behavior of legacy `classifyJpPos`.
JpPosCategory classifyJpPos(String pos) {
  if (pos.isEmpty) return JpPosCategory.other;
  final head = pos.split(',').first;
  switch (head) {
    case '名詞':
      return JpPosCategory.noun;
    case '動詞':
      return JpPosCategory.verb;
    case '形容詞':
      return JpPosCategory.adjective;
    case '副詞':
      return JpPosCategory.adverb;
    case '助詞':
      return JpPosCategory.particle;
    case '助動詞':
      return JpPosCategory.auxiliary;
    default:
      return JpPosCategory.other;
  }
}
