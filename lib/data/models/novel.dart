import 'chapter.dart';
import 'jlpt_stats.dart';

enum ContentType { novel, news, lightNovel, webNovel, shortStory }
enum SourceType { epub, txt, feed, web, paste }

String contentTypeToJson(ContentType c) {
  switch (c) {
    case ContentType.lightNovel: return 'light-novel';
    case ContentType.webNovel: return 'web-novel';
    case ContentType.shortStory: return 'short-story';
    default: return c.name;
  }
}

ContentType? contentTypeFromJson(dynamic v) {
  if (v == null) return null;
  switch (v) {
    case 'novel': return ContentType.novel;
    case 'news': return ContentType.news;
    case 'light-novel': return ContentType.lightNovel;
    case 'web-novel': return ContentType.webNovel;
    case 'short-story': return ContentType.shortStory;
    default: return null;
  }
}

SourceType? sourceTypeFromJson(dynamic v) {
  if (v == null) return null;
  return SourceType.values.firstWhere(
    (s) => s.name == v,
    orElse: () => SourceType.paste,
  );
}

class NovelMeta {
  final String id;
  String title;
  String? author;
  String? coverUrl;
  String sourceLanguage;
  String targetLanguage;
  int chapterCount;
  int addedAt;
  int lastReadChapter;
  int lastReadOffset;
  int? lastReadAt;
  bool hasUserTranslation;
  bool favorite;
  ContentType? contentType;
  SourceType? sourceType;
  String? sourceId;
  String? sourceUrl;
  int? publishedAt;
  List<String>? tags;
  List<String>? collectionIds;
  JlptStats? jlptStats;

  NovelMeta({
    required this.id,
    required this.title,
    this.author,
    this.coverUrl,
    this.sourceLanguage = 'ja',
    this.targetLanguage = 'en',
    this.chapterCount = 0,
    required this.addedAt,
    this.lastReadChapter = 0,
    this.lastReadOffset = 0,
    this.lastReadAt,
    this.hasUserTranslation = false,
    this.favorite = false,
    this.contentType,
    this.sourceType,
    this.sourceId,
    this.sourceUrl,
    this.publishedAt,
    this.tags,
    this.collectionIds,
    this.jlptStats,
  });

  NovelMeta copyWith({
    String? title,
    String? author,
    String? coverUrl,
    String? sourceLanguage,
    String? targetLanguage,
    int? chapterCount,
    int? lastReadChapter,
    int? lastReadOffset,
    int? lastReadAt,
    bool? hasUserTranslation,
    bool? favorite,
    ContentType? contentType,
    SourceType? sourceType,
    String? sourceId,
    String? sourceUrl,
    int? publishedAt,
    List<String>? tags,
    List<String>? collectionIds,
    JlptStats? jlptStats,
  }) {
    return NovelMeta(
      id: id,
      title: title ?? this.title,
      author: author ?? this.author,
      coverUrl: coverUrl ?? this.coverUrl,
      sourceLanguage: sourceLanguage ?? this.sourceLanguage,
      targetLanguage: targetLanguage ?? this.targetLanguage,
      chapterCount: chapterCount ?? this.chapterCount,
      addedAt: addedAt,
      lastReadChapter: lastReadChapter ?? this.lastReadChapter,
      lastReadOffset: lastReadOffset ?? this.lastReadOffset,
      lastReadAt: lastReadAt ?? this.lastReadAt,
      hasUserTranslation: hasUserTranslation ?? this.hasUserTranslation,
      favorite: favorite ?? this.favorite,
      contentType: contentType ?? this.contentType,
      sourceType: sourceType ?? this.sourceType,
      sourceId: sourceId ?? this.sourceId,
      sourceUrl: sourceUrl ?? this.sourceUrl,
      publishedAt: publishedAt ?? this.publishedAt,
      tags: tags ?? this.tags,
      collectionIds: collectionIds ?? this.collectionIds,
      jlptStats: jlptStats ?? this.jlptStats,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        if (author != null) 'author': author,
        if (coverUrl != null) 'coverUrl': coverUrl,
        'sourceLanguage': sourceLanguage,
        'targetLanguage': targetLanguage,
        'chapterCount': chapterCount,
        'addedAt': addedAt,
        'lastReadChapter': lastReadChapter,
        'lastReadOffset': lastReadOffset,
        if (lastReadAt != null) 'lastReadAt': lastReadAt,
        'hasUserTranslation': hasUserTranslation,
        if (favorite) 'favorite': favorite,
        if (contentType != null) 'contentType': contentTypeToJson(contentType!),
        if (sourceType != null) 'sourceType': sourceType!.name,
        if (sourceId != null) 'sourceId': sourceId,
        if (sourceUrl != null) 'sourceUrl': sourceUrl,
        if (publishedAt != null) 'publishedAt': publishedAt,
        if (tags != null) 'tags': tags,
        if (collectionIds != null) 'collectionIds': collectionIds,
        if (jlptStats != null) 'jlptStats': jlptStats!.toJson(),
      };

  factory NovelMeta.fromJson(Map<String, dynamic> j) => NovelMeta(
        id: j['id'] as String,
        title: j['title'] as String? ?? '',
        author: j['author'] as String?,
        coverUrl: j['coverUrl'] as String?,
        sourceLanguage: j['sourceLanguage'] as String? ?? 'ja',
        targetLanguage: j['targetLanguage'] as String? ?? 'en',
        chapterCount: (j['chapterCount'] as num?)?.toInt() ?? 0,
        addedAt: (j['addedAt'] as num?)?.toInt() ?? 0,
        lastReadChapter: (j['lastReadChapter'] as num?)?.toInt() ?? 0,
        lastReadOffset: (j['lastReadOffset'] as num?)?.toInt() ?? 0,
        lastReadAt: (j['lastReadAt'] as num?)?.toInt(),
        hasUserTranslation: j['hasUserTranslation'] as bool? ?? false,
        favorite: j['favorite'] as bool? ?? false,
        contentType: contentTypeFromJson(j['contentType']),
        sourceType: sourceTypeFromJson(j['sourceType']),
        sourceId: j['sourceId'] as String?,
        sourceUrl: j['sourceUrl'] as String?,
        publishedAt: (j['publishedAt'] as num?)?.toInt(),
        tags: (j['tags'] as List?)?.cast<String>(),
        collectionIds: (j['collectionIds'] as List?)?.cast<String>(),
        jlptStats: j['jlptStats'] is Map
            ? JlptStats.fromJson(Map<String, dynamic>.from(j['jlptStats'] as Map))
            : null,
      );
}

class NovelBody {
  final String id;
  final List<Chapter> chapters;

  NovelBody({required this.id, required this.chapters});

  Map<String, dynamic> toJson() => {
        'id': id,
        'chapters': chapters.map((c) => c.toJson()).toList(),
      };

  factory NovelBody.fromJson(Map<String, dynamic> j) => NovelBody(
        id: j['id'] as String,
        chapters: ((j['chapters'] as List?) ?? const [])
            .map((c) => Chapter.fromJson(Map<String, dynamic>.from(c as Map)))
            .toList(),
      );
}
