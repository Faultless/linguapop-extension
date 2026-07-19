enum TranslationStatus { none, pending, translated, failed }

class Chapter {
  final String id;
  String title;
  String originalText;
  String? translatedText;
  TranslationStatus translationStatus;
  String? sourceUrl;
  int? publishedAt;
  /// Optional lead image (news articles). Remote URL; lazy-loaded in listings.
  String? imageUrl;

  Chapter({
    required this.id,
    required this.title,
    required this.originalText,
    this.translatedText,
    this.translationStatus = TranslationStatus.none,
    this.sourceUrl,
    this.publishedAt,
    this.imageUrl,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'originalText': originalText,
        if (translatedText != null) 'translatedText': translatedText,
        'translationStatus': translationStatus.name,
        if (sourceUrl != null) 'sourceUrl': sourceUrl,
        if (publishedAt != null) 'publishedAt': publishedAt,
        if (imageUrl != null) 'imageUrl': imageUrl,
      };

  factory Chapter.fromJson(Map<String, dynamic> j) => Chapter(
        id: j['id'] as String,
        title: j['title'] as String? ?? '',
        originalText: j['originalText'] as String? ?? '',
        translatedText: j['translatedText'] as String?,
        translationStatus: _parseStatus(j['translationStatus']),
        sourceUrl: j['sourceUrl'] as String?,
        publishedAt: (j['publishedAt'] as num?)?.toInt(),
        imageUrl: j['imageUrl'] as String?,
      );

  static TranslationStatus _parseStatus(dynamic v) {
    switch (v) {
      case 'pending':
        return TranslationStatus.pending;
      case 'translated':
        return TranslationStatus.translated;
      case 'failed':
        return TranslationStatus.failed;
      default:
        return TranslationStatus.none;
    }
  }
}
