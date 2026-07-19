import 'dart:async';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/reader_prefs.dart';
import '../../providers/news_provider.dart';
import '../../providers/prefs_provider.dart';
import '../../providers/sources_provider.dart';
import '../widgets/difficulty_badge.dart';
import '../widgets/news_thumb.dart';
import '../widgets/view_mode_button.dart';
import '../widgets/web_source_notice.dart';

const _kAllSources = 'all';
// Per-source cap for one sync pass — keeps a first sync from importing a
// whole feed's backlog in one go.
const _kSyncCapPerSource = 10;

/// News hub: every imported feed article in one place — newest first, grouped
/// by day, with read state, per-article JLPT difficulty, swipe-to-delete and
/// a one-tap "fetch latest" sync across all feed sources.
class NewsScreen extends ConsumerStatefulWidget {
  const NewsScreen({super.key});
  @override
  ConsumerState<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends ConsumerState<NewsScreen> {
  String _sourceFilter = _kAllSources;
  bool _unreadOnly = false;

  bool _syncing = false;
  String _syncStatus = '';

  Future<void> _sync() async {
    if (_syncing) return;
    setState(() {
      _syncing = true;
      _syncStatus = 'Checking feeds…';
    });
    final registry = ref.read(sourceRegistryProvider);
    final importer = ref.read(sourceImporterProvider);
    var added = 0;
    final failed = <String>[];
    for (final source in registry.feedSources) {
      try {
        final stubs = await source.list();
        final imported =
            await ref.read(importedArticleUrlsProvider(source.id).future);
        final fresh = stubs
            .where((s) => !imported.contains(s.sourceUrl))
            .take(_kSyncCapPerSource)
            .toList();
        for (var i = 0; i < fresh.length; i++) {
          if (!mounted) return;
          setState(() => _syncStatus =
              '${source.name}: ${i + 1} / ${fresh.length}');
          await importer.importArticle(source: source, stub: fresh[i]);
          added++;
          // Politeness delay between article fetches.
          await Future<void>.delayed(const Duration(milliseconds: 250));
        }
      } catch (_) {
        failed.add(source.name);
      }
    }
    if (!mounted) return;
    setState(() {
      _syncing = false;
      _syncStatus = '';
    });
    final msg = StringBuffer(
        added == 0 ? 'No new articles.' : 'Fetched $added new article${added == 1 ? "" : "s"}.');
    if (failed.isNotEmpty) msg.write(' (${failed.join(", ")} failed)');
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg.toString())));
  }

  Future<void> _delete(NewsArticle a) async {
    await ref.read(sourceImporterProvider).removeArticle(
          sourceId: a.sourceId,
          sourceUrl: a.chapter.sourceUrl ?? '',
        );
  }

  void _open(NewsArticle a) {
    ref
        .read(newsReadProvider.notifier)
        .markRead(a.novelId, a.chapter.id);
    context.go('/reader/${a.novelId}?ch=${a.chapterIndex}');
  }

  @override
  Widget build(BuildContext context) {
    // Same restriction as the sources screen: the feed adapters are
    // dart:io-based and cannot run on Flutter web.
    if (kIsWeb) {
      return Scaffold(
        appBar: AppBar(title: const Text('News')),
        body: const SafeArea(child: WebSourceNotice()),
      );
    }
    final articlesAsync = ref.watch(newsArticlesProvider);
    final readSet = ref.watch(newsReadProvider);
    final registry = ref.watch(sourceRegistryProvider);
    final viewMode = ref.watch(readerPrefsProvider).newsViewMode;

    return Scaffold(
      appBar: AppBar(
        title: const Text('News'),
        actions: [
          ViewModeButton(
            mode: viewMode,
            onChanged: (m) =>
                ref.read(readerPrefsProvider.notifier).setNewsViewMode(m),
          ),
          IconButton(
            tooltip: 'Fetch latest articles',
            onPressed: _syncing ? null : _sync,
            icon: _syncing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2.2))
                : const Icon(Icons.refresh),
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'read-all') _markAllRead();
            },
            itemBuilder: (ctx) => const [
              PopupMenuItem(
                  value: 'read-all', child: Text('Mark all as read')),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_syncing)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Row(children: [
                  Expanded(
                    child: Text(_syncStatus,
                        style: const TextStyle(fontSize: 12)),
                  ),
                ]),
              ),
            _FilterRow(
              sources: [
                for (final s in registry.feedSources)
                  (id: s.id, name: s.name),
              ],
              selected: _sourceFilter,
              onSelected: (id) => setState(() => _sourceFilter = id),
              unreadOnly: _unreadOnly,
              onUnreadToggled: () =>
                  setState(() => _unreadOnly = !_unreadOnly),
            ),
            const Divider(height: 1),
            Expanded(
              child: articlesAsync.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Failed to load: $e')),
                data: (articles) {
                  var items = articles;
                  if (_sourceFilter != _kAllSources) {
                    items = items
                        .where((a) => a.sourceId == _sourceFilter)
                        .toList();
                  }
                  if (_unreadOnly) {
                    items = items
                        .where((a) => !readSet.contains(
                            NewsReadNotifier.keyFor(
                                a.novelId, a.chapter.id)))
                        .toList();
                  }
                  if (items.isEmpty) {
                    return _EmptyState(
                        hasAnyArticles: articles.isNotEmpty,
                        syncing: _syncing,
                        onSync: _sync);
                  }
                  bool isRead(NewsArticle a) => readSet.contains(
                      NewsReadNotifier.keyFor(a.novelId, a.chapter.id));
                  String nameOf(NewsArticle a) =>
                      registry.byId(a.sourceId)?.name ?? a.sourceId;

                  if (viewMode == LibraryViewMode.grid) {
                    return RefreshIndicator(
                      onRefresh: _sync,
                      child: _NewsGrid(
                        items: items,
                        isRead: isRead,
                        nameOf: nameOf,
                        onOpen: _open,
                        onDelete: _delete,
                      ),
                    );
                  }

                  final rows = _withHeaders(items);
                  return RefreshIndicator(
                    onRefresh: _sync,
                    child: ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.only(bottom: 48),
                      itemCount: rows.length,
                      itemBuilder: (ctx, i) {
                        final row = rows[i];
                        if (row is String) return _DayHeader(label: row);
                        final a = row as NewsArticle;
                        return _ArticleRow(
                          key: ValueKey('${a.novelId}/${a.chapter.id}'),
                          article: a,
                          sourceName: nameOf(a),
                          read: isRead(a),
                          big: viewMode == LibraryViewMode.card,
                          onTap: () => _open(a),
                          onDelete: () => _delete(a),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _markAllRead() async {
    final articles = ref.read(newsArticlesProvider).valueOrNull ?? const [];
    final notifier = ref.read(newsReadProvider.notifier);
    for (final a in articles) {
      await notifier.markRead(a.novelId, a.chapter.id);
    }
  }

  /// Interleave day-header strings into the article list. Articles are
  /// already sorted newest-first.
  List<Object> _withHeaders(List<NewsArticle> items) {
    final out = <Object>[];
    String? lastDay;
    for (final a in items) {
      final day = _dayLabel(a.chapter.publishedAt);
      if (day != lastDay) {
        out.add(day);
        lastDay = day;
      }
      out.add(a);
    }
    return out;
  }
}

String _dayLabel(int? publishedAt) {
  if (publishedAt == null) return 'Undated';
  final dt = DateTime.fromMillisecondsSinceEpoch(publishedAt);
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(dt.year, dt.month, dt.day);
  final diff = today.difference(day).inDays;
  if (diff == 0) return 'Today';
  if (diff == 1) return 'Yesterday';
  return '${day.year}-${day.month.toString().padLeft(2, "0")}-${day.day.toString().padLeft(2, "0")}';
}

String _timeLabel(int? publishedAt) {
  if (publishedAt == null) return '';
  final dt = DateTime.fromMillisecondsSinceEpoch(publishedAt);
  return '${dt.hour.toString().padLeft(2, "0")}:${dt.minute.toString().padLeft(2, "0")}';
}

class _FilterRow extends StatelessWidget {
  final List<({String id, String name})> sources;
  final String selected;
  final ValueChanged<String> onSelected;
  final bool unreadOnly;
  final VoidCallback onUnreadToggled;
  const _FilterRow({
    required this.sources,
    required this.selected,
    required this.onSelected,
    required this.unreadOnly,
    required this.onUnreadToggled,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      child: Row(
        children: [
          FilterChip(
            label: const Text('Unread'),
            selected: unreadOnly,
            onSelected: (_) => onUnreadToggled(),
            visualDensity: VisualDensity.compact,
          ),
          const SizedBox(width: 12),
          ChoiceChip(
            label: const Text('All'),
            selected: selected == _kAllSources,
            onSelected: (_) => onSelected(_kAllSources),
            visualDensity: VisualDensity.compact,
          ),
          for (final s in sources) ...[
            const SizedBox(width: 8),
            ChoiceChip(
              label: Text(s.name),
              selected: selected == s.id,
              onSelected: (_) => onSelected(s.id),
              visualDensity: VisualDensity.compact,
            ),
          ],
        ],
      ),
    );
  }
}

class _DayHeader extends StatelessWidget {
  final String label;
  const _DayHeader({required this.label});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 6),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.1,
          color: cs.primary,
        ),
      ),
    );
  }
}

class _ArticleRow extends StatelessWidget {
  final NewsArticle article;
  final String sourceName;
  final bool read;
  /// Card view: larger lead image and a one-line text snippet.
  final bool big;
  final VoidCallback onTap;
  final Future<void> Function() onDelete;
  const _ArticleRow({
    super.key,
    required this.article,
    required this.sourceName,
    required this.read,
    required this.onTap,
    required this.onDelete,
    this.big = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final time = _timeLabel(article.chapter.publishedAt);
    final thumbSize = big ? 84.0 : 60.0;
    final hasImage = (article.chapter.imageUrl ?? '').isNotEmpty;

    final meta = Row(
      children: [
        // Unread dot.
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: read ? Colors.transparent : cs.primary,
            border: read
                ? Border.all(color: cs.onSurface.withValues(alpha: 0.25))
                : null,
          ),
        ),
        const SizedBox(width: 7),
        Flexible(
          child: Text(
            time.isEmpty ? sourceName : '$sourceName · $time',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 11.5,
              color: cs.onSurface.withValues(alpha: 0.55),
            ),
          ),
        ),
        const SizedBox(width: 8),
        DifficultyBadge(
          text: article.chapter.originalText,
          showBar: !big,
        ),
      ],
    );

    return Dismissible(
      key: ValueKey('dismiss-${article.novelId}-${article.chapter.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        color: cs.errorContainer,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: Icon(Icons.delete_outline, color: cs.onErrorContainer),
      ),
      onDismissed: (_) => onDelete(),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.fromLTRB(16, big ? 12 : 10, 16, big ? 12 : 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      article.chapter.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: big ? 15.5 : 14.5,
                        height: 1.3,
                        fontWeight: read ? FontWeight.w400 : FontWeight.w600,
                        color: read
                            ? cs.onSurface.withValues(alpha: 0.65)
                            : cs.onSurface,
                      ),
                    ),
                    if (big) ...[
                      const SizedBox(height: 4),
                      Text(
                        article.chapter.originalText.replaceAll('\n', ' '),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12.5,
                          height: 1.35,
                          color: cs.onSurface.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                    const SizedBox(height: 6),
                    meta,
                  ],
                ),
              ),
              if (hasImage) ...[
                const SizedBox(width: 12),
                NewsThumb(
                  url: article.chapter.imageUrl,
                  width: thumbSize,
                  height: thumbSize,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Media (grid) view for news: image-forward 2-up tiles, newest first.
class _NewsGrid extends StatelessWidget {
  final List<NewsArticle> items;
  final bool Function(NewsArticle) isRead;
  final String Function(NewsArticle) nameOf;
  final void Function(NewsArticle) onOpen;
  final Future<void> Function(NewsArticle) onDelete;
  const _NewsGrid({
    required this.items,
    required this.isRead,
    required this.nameOf,
    required this.onOpen,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    final cols = (w / 220).floor().clamp(2, 5);
    return GridView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 48),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: cols,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 0.82,
      ),
      itemCount: items.length,
      itemBuilder: (ctx, i) {
        final a = items[i];
        return _NewsGridTile(
          article: a,
          sourceName: nameOf(a),
          read: isRead(a),
          onTap: () => onOpen(a),
        );
      },
    );
  }
}

class _NewsGridTile extends StatelessWidget {
  final NewsArticle article;
  final String sourceName;
  final bool read;
  final VoidCallback onTap;
  const _NewsGridTile({
    required this.article,
    required this.sourceName,
    required this.read,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final time = _timeLabel(article.chapter.publishedAt);
    return Material(
      color: cs.onSurface.withValues(alpha: 0.04),
      borderRadius: BorderRadius.circular(12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: NewsThumb(
                url: article.chapter.imageUrl,
                width: double.infinity,
                height: double.infinity,
                radius: 0,
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        article.chapter.title,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.25,
                          fontWeight:
                              read ? FontWeight.w500 : FontWeight.w700,
                          color: read
                              ? cs.onSurface.withValues(alpha: 0.7)
                              : cs.onSurface,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (!read)
                          Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: Container(
                              width: 7,
                              height: 7,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: cs.primary,
                              ),
                            ),
                          ),
                        Expanded(
                          child: Text(
                            time.isEmpty ? sourceName : '$sourceName · $time',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 10.5,
                              color: cs.onSurface.withValues(alpha: 0.55),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        DifficultyBadge(
                          text: article.chapter.originalText,
                          fontSize: 9.5,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final bool hasAnyArticles;
  final bool syncing;
  final Future<void> Function() onSync;
  const _EmptyState({
    required this.hasAnyArticles,
    required this.syncing,
    required this.onSync,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.newspaper_outlined,
              size: 48, color: cs.onSurface.withValues(alpha: 0.3)),
          const SizedBox(height: 12),
          Text(
            hasAnyArticles
                ? 'Nothing matches the current filter.'
                : 'No news articles yet.',
            style: TextStyle(
                fontSize: 14, color: cs.onSurface.withValues(alpha: 0.65)),
          ),
          const SizedBox(height: 14),
          if (!hasAnyArticles)
            FilledButton.tonalIcon(
              onPressed: syncing ? null : onSync,
              icon: const Icon(Icons.refresh),
              label: const Text('Fetch latest articles'),
            ),
        ],
      ),
    );
  }
}
