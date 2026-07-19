import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/chapter.dart';
import '../data/models/novel.dart';
import '../data/storage/storage.dart';
import 'novels_provider.dart';

const _readKey = 'news_read_ids';
// Keep the read-set bounded — old feed articles get deleted from the library
// anyway, so an LRU of the most recent marks is plenty.
const _maxReadIds = 600;

/// Read/unread state for feed news articles. Keys are `'$novelId/$chapterId'`.
/// Persisted in the prefs box.
class NewsReadNotifier extends StateNotifier<Set<String>> {
  NewsReadNotifier() : super(_load());

  static Set<String> _load() {
    try {
      final raw = Storage.prefs().get(_readKey);
      if (raw is String && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List) return decoded.cast<String>().toSet();
      }
    } catch (_) {}
    return {};
  }

  Future<void> _persist() async {
    var ids = state.toList();
    if (ids.length > _maxReadIds) {
      ids = ids.sublist(ids.length - _maxReadIds);
    }
    await Storage.prefs().put(_readKey, jsonEncode(ids));
  }

  static String keyFor(String novelId, String chapterId) =>
      '$novelId/$chapterId';

  bool isRead(String novelId, String chapterId) =>
      state.contains(keyFor(novelId, chapterId));

  Future<void> markRead(String novelId, String chapterId) async {
    final k = keyFor(novelId, chapterId);
    if (state.contains(k)) return;
    state = {...state, k};
    await _persist();
  }

  Future<void> markUnread(String novelId, String chapterId) async {
    final k = keyFor(novelId, chapterId);
    if (!state.contains(k)) return;
    state = {...state}..remove(k);
    await _persist();
  }
}

final newsReadProvider =
    StateNotifierProvider<NewsReadNotifier, Set<String>>(
        (ref) => NewsReadNotifier());

/// One imported feed article, flattened out of its rolling feed novel for the
/// news hub list.
class NewsArticle {
  final String novelId; // 'feed:<sourceId>'
  final String sourceId;
  final int chapterIndex;
  final Chapter chapter;
  const NewsArticle({
    required this.novelId,
    required this.sourceId,
    required this.chapterIndex,
    required this.chapter,
  });
}

/// Every imported feed article across all news sources, newest first.
/// Recomputes whenever the library changes (imports, deletions, syncs).
final newsArticlesProvider = FutureProvider<List<NewsArticle>>((ref) async {
  final metas = ref
      .watch(novelsProvider)
      .where((m) => m.sourceType == SourceType.feed)
      .toList();
  final notifier = ref.read(novelsProvider.notifier);
  final out = <NewsArticle>[];
  for (final m in metas) {
    final body = await notifier.loadBody(m.id);
    if (body == null) continue;
    final sourceId =
        m.sourceId ?? (m.id.startsWith('feed:') ? m.id.substring(5) : m.id);
    for (var i = 0; i < body.chapters.length; i++) {
      out.add(NewsArticle(
        novelId: m.id,
        sourceId: sourceId,
        chapterIndex: i,
        chapter: body.chapters[i],
      ));
    }
  }
  out.sort((a, b) =>
      (b.chapter.publishedAt ?? 0).compareTo(a.chapter.publishedAt ?? 0));
  return out;
});
