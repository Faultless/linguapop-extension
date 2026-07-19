class DictSense {
  final List<String> partsOfSpeech;
  final List<String> definitions;
  final List<String> tags;

  const DictSense({
    this.partsOfSpeech = const [],
    this.definitions = const [],
    this.tags = const [],
  });

  Map<String, dynamic> toJson() => {
        'partsOfSpeech': partsOfSpeech,
        'definitions': definitions,
        'tags': tags,
      };

  factory DictSense.fromJson(Map<String, dynamic> j) => DictSense(
        partsOfSpeech: ((j['partsOfSpeech'] as List?) ?? const []).cast<String>(),
        definitions: ((j['definitions'] as List?) ?? const []).cast<String>(),
        tags: ((j['tags'] as List?) ?? const []).cast<String>(),
      );
}

class DictEntry {
  final String word;
  final List<String> readings;
  final bool isCommon;
  final int? jlptLevel;
  final List<DictSense> senses;

  const DictEntry({
    required this.word,
    this.readings = const [],
    this.isCommon = false,
    this.jlptLevel,
    this.senses = const [],
  });

  Map<String, dynamic> toJson() => {
        'word': word,
        'readings': readings,
        'isCommon': isCommon,
        if (jlptLevel != null) 'jlptLevel': jlptLevel,
        'senses': senses.map((s) => s.toJson()).toList(),
      };

  factory DictEntry.fromJson(Map<String, dynamic> j) => DictEntry(
        word: j['word'] as String,
        readings: ((j['readings'] as List?) ?? const []).cast<String>(),
        isCommon: j['isCommon'] as bool? ?? false,
        jlptLevel: (j['jlptLevel'] as num?)?.toInt(),
        senses: ((j['senses'] as List?) ?? const [])
            .map((s) => DictSense.fromJson(Map<String, dynamic>.from(s as Map)))
            .toList(),
      );
}

class DictResult {
  final String query;
  final List<DictEntry> entries;
  final int fetchedAt;

  const DictResult({
    required this.query,
    required this.entries,
    required this.fetchedAt,
  });

  Map<String, dynamic> toJson() => {
        'query': query,
        'entries': entries.map((e) => e.toJson()).toList(),
        'fetchedAt': fetchedAt,
      };

  factory DictResult.fromJson(Map<String, dynamic> j) => DictResult(
        query: j['query'] as String,
        entries: ((j['entries'] as List?) ?? const [])
            .map((e) => DictEntry.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
        fetchedAt: (j['fetchedAt'] as num?)?.toInt() ?? 0,
      );
}
