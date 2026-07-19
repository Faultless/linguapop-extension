class VocabEntry {
  final String id;
  final String base;
  String surface;
  String? reading;
  int? jlptLevel; // 1..5
  List<String>? partsOfSpeech;
  List<String> glosses;
  String? exampleSentence;
  String? sourceNovelId;
  String? sourceNovelTitle;
  String? sourceChapterId;
  int? sourceChapterIndex;
  String? sourceUrl;
  final int addedAt;
  int? exportedAt;
  List<String>? tags;
  bool isPhrase;

  VocabEntry({
    required this.id,
    required this.base,
    required this.surface,
    this.reading,
    this.jlptLevel,
    this.partsOfSpeech,
    this.glosses = const [],
    this.exampleSentence,
    this.sourceNovelId,
    this.sourceNovelTitle,
    this.sourceChapterId,
    this.sourceChapterIndex,
    this.sourceUrl,
    required this.addedAt,
    this.exportedAt,
    this.tags,
    this.isPhrase = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'base': base,
        'surface': surface,
        if (reading != null) 'reading': reading,
        if (jlptLevel != null) 'jlptLevel': jlptLevel,
        if (partsOfSpeech != null) 'partsOfSpeech': partsOfSpeech,
        'glosses': glosses,
        if (exampleSentence != null) 'exampleSentence': exampleSentence,
        if (sourceNovelId != null) 'sourceNovelId': sourceNovelId,
        if (sourceNovelTitle != null) 'sourceNovelTitle': sourceNovelTitle,
        if (sourceChapterId != null) 'sourceChapterId': sourceChapterId,
        if (sourceChapterIndex != null) 'sourceChapterIndex': sourceChapterIndex,
        if (sourceUrl != null) 'sourceUrl': sourceUrl,
        'addedAt': addedAt,
        if (exportedAt != null) 'exportedAt': exportedAt,
        if (tags != null) 'tags': tags,
        if (isPhrase) 'isPhrase': true,
      };

  factory VocabEntry.fromJson(Map<String, dynamic> j) => VocabEntry(
        id: j['id'] as String,
        base: j['base'] as String,
        surface: j['surface'] as String? ?? '',
        reading: j['reading'] as String?,
        jlptLevel: (j['jlptLevel'] as num?)?.toInt(),
        partsOfSpeech: (j['partsOfSpeech'] as List?)?.cast<String>(),
        glosses: ((j['glosses'] as List?) ?? const []).cast<String>(),
        exampleSentence: j['exampleSentence'] as String?,
        sourceNovelId: j['sourceNovelId'] as String?,
        sourceNovelTitle: j['sourceNovelTitle'] as String?,
        sourceChapterId: j['sourceChapterId'] as String?,
        sourceChapterIndex: (j['sourceChapterIndex'] as num?)?.toInt(),
        sourceUrl: j['sourceUrl'] as String?,
        addedAt: (j['addedAt'] as num?)?.toInt() ?? 0,
        exportedAt: (j['exportedAt'] as num?)?.toInt(),
        tags: (j['tags'] as List?)?.cast<String>(),
        isPhrase: j['isPhrase'] as bool? ?? false,
      );
}
