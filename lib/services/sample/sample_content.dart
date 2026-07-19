import 'package:flutter/services.dart' show rootBundle;

import '../../data/models/chapter.dart';
import '../../data/models/novel.dart';
import '../../providers/novels_provider.dart';

/// Fixed ids so loading sample content twice is a no-op instead of a dupe.
const kSampleNovelId = 'sample-kumo-no-ito';
const kSampleNewsId = 'sample-weather-news';

/// Bundled demo content for platforms where live sources can't run (web).
/// The novel is 蜘蛛の糸 by Akutagawa Ryūnosuke — public domain (author died
/// 1927), text pulled from Aozora Bunko. The "news" sample is an original
/// short article written in NHK Easy's plain-Japanese style for this app —
/// not scraped or reproduced from any real outlet, so it ships with no
/// licensing question attached.
class SampleContentService {
  final NovelsNotifier _novels;
  SampleContentService(this._novels);

  bool get isLoaded =>
      _novels.findById(kSampleNovelId) != null &&
      _novels.findById(kSampleNewsId) != null;

  Future<void> loadAll() async {
    if (_novels.findById(kSampleNovelId) == null) await _loadNovel();
    if (_novels.findById(kSampleNewsId) == null) await _loadNews();
  }

  Future<void> _loadNovel() async {
    final text =
        await rootBundle.loadString('assets/sample/kumo_no_ito.txt');
    final chapter = Chapter(
      id: '$kSampleNovelId-ch1',
      title: '蜘蛛の糸',
      originalText: text.trim(),
    );
    final meta = NovelMeta(
      id: kSampleNovelId,
      title: '蜘蛛の糸 (The Spider\'s Thread)',
      author: '芥川龍之介 (Akutagawa Ryūnosuke)',
      sourceLanguage: 'ja',
      targetLanguage: 'en',
      chapterCount: 1,
      addedAt: DateTime.now().millisecondsSinceEpoch,
      contentType: ContentType.shortStory,
      sourceType: SourceType.txt,
      tags: const ['sample', 'public domain', '1918'],
    );
    await _novels.add(meta, NovelBody(id: kSampleNovelId, chapters: [chapter]));
  }

  Future<void> _loadNews() async {
    final raw = await rootBundle.loadString('assets/sample/sample_news.txt');
    final lines = raw.trim().split('\n');
    final headline = lines.first.trim();
    final body = lines.skip(1).join('\n').trim();
    final chapter = Chapter(
      id: '$kSampleNewsId-ch1',
      title: headline,
      originalText: body,
    );
    final meta = NovelMeta(
      id: kSampleNewsId,
      title: 'Sample article: $headline',
      sourceLanguage: 'ja',
      targetLanguage: 'en',
      chapterCount: 1,
      addedAt: DateTime.now().millisecondsSinceEpoch,
      contentType: ContentType.news,
      sourceType: SourceType.paste,
      tags: const ['sample'],
    );
    await _novels.add(meta, NovelBody(id: kSampleNewsId, chapters: [chapter]));
  }
}
