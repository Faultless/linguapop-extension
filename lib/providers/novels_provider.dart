import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/chapter.dart';
import '../data/models/novel.dart';
import '../data/storage/storage.dart';
import '../services/covers/cover_service.dart';
import 'covers_provider.dart';

const _metaListKey = 'list';

class NovelsNotifier extends StateNotifier<List<NovelMeta>> {
  NovelsNotifier() : super(_load());

  /// Read-only view of the current meta list, safe to call from outside the
  /// notifier (e.g. from source importers that need to check for an existing
  /// rolling feed novel before deciding whether to dedup or create).
  List<NovelMeta> get all => state;

  NovelMeta? findById(String id) {
    for (final m in state) {
      if (m.id == id) return m;
    }
    return null;
  }

  static List<NovelMeta> _load() {
    try {
      final raw = Storage.novelsMeta().get(_metaListKey);
      if (raw is String && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          return decoded
              .map((j) =>
                  NovelMeta.fromJson(Map<String, dynamic>.from(j as Map)))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<void> _persist() async {
    await Storage.novelsMeta()
        .put(_metaListKey, jsonEncode(state.map((m) => m.toJson()).toList()));
  }

  Future<void> add(NovelMeta meta, NovelBody body) async {
    final existing = state.where((m) => m.id != meta.id).toList();
    state = [meta, ...existing];
    await Storage.novelBody().put(meta.id, jsonEncode(body.toJson()));
    await _persist();
  }

  Future<void> remove(String id) async {
    state = state.where((m) => m.id != id).toList();
    await Storage.novelBody().delete(id);
    await LocalCoverStore.delete(id);
    await _persist();
  }

  Future<void> updateMeta(NovelMeta updated) async {
    state = [
      for (final m in state)
        if (m.id == updated.id) updated else m,
    ];
    await _persist();
  }

  /// Mutate one meta in place and re-emit. Used for the small per-book edits
  /// (favorite, tags, collections, cover) where `copyWith` can't express
  /// nulling a field (e.g. clearing a cover).
  Future<void> _mutate(String id, void Function(NovelMeta) fn) async {
    final m = findById(id);
    if (m == null) return;
    fn(m);
    state = [...state];
    await _persist();
  }

  Future<void> toggleFavorite(String id) =>
      _mutate(id, (m) => m.favorite = !m.favorite);

  Future<void> setTags(String id, List<String> tags) =>
      _mutate(id, (m) => m.tags = tags.isEmpty ? null : tags);

  Future<void> setCollections(String id, List<String> collectionIds) =>
      _mutate(id, (m) => m.collectionIds =
          collectionIds.isEmpty ? null : collectionIds);

  Future<void> setContentType(String id, ContentType? type) =>
      _mutate(id, (m) => m.contentType = type);

  /// Set (or clear, with null) the cover URL. Accepts a remote/`data:` URL or
  /// the `local:` scheme handled by [LocalCoverStore].
  Future<void> setCover(String id, String? url) =>
      _mutate(id, (m) => m.coverUrl = url);

  /// Best-effort cover lookup for a freshly-imported book. No-op if the book
  /// already has a cover, or if nothing is found. Safe to fire-and-forget.
  Future<void> autoFetchCover(String id, {CoverService? service}) async {
    final m = findById(id);
    if (m == null || (m.coverUrl != null && m.coverUrl!.isNotEmpty)) return;
    final svc = service ?? CoverService();
    try {
      final url = await svc.firstCover(m.title, author: m.author);
      if (url != null) await setCover(id, url);
    } catch (_) {
    } finally {
      if (service == null) svc.close();
    }
  }

  Future<NovelBody?> loadBody(String id) async {
    final raw = Storage.novelBody().get(id);
    if (raw is String && raw.isNotEmpty) {
      try {
        return NovelBody.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      } catch (_) {}
    }
    return null;
  }

  Future<void> saveBody(NovelBody body) async {
    await Storage.novelBody().put(body.id, jsonEncode(body.toJson()));
  }

  Future<void> saveChapter(String novelId, Chapter chapter) async {
    final body = await loadBody(novelId);
    if (body == null) return;
    final updatedChapters = [
      for (final c in body.chapters)
        if (c.id == chapter.id) chapter else c,
    ];
    await saveBody(NovelBody(id: novelId, chapters: updatedChapters));
  }
}

final novelsProvider =
    StateNotifierProvider<NovelsNotifier, List<NovelMeta>>(
  (ref) => NovelsNotifier(),
);

final novelBodyProvider =
    FutureProvider.family<NovelBody?, String>((ref, id) async {
  return ref.read(novelsProvider.notifier).loadBody(id);
});
