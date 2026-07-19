import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/novel.dart';
import '../../services/covers/cover_service.dart';
import '../../providers/collections_provider.dart';
import '../../providers/covers_provider.dart';
import '../../providers/novels_provider.dart';
import '../widgets/book_cover.dart';
import '../widgets/jlpt_badge.dart';

class BookDetailScreen extends ConsumerWidget {
  final String novelId;
  const BookDetailScreen({super.key, required this.novelId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final novels = ref.watch(novelsProvider);
    final collections = ref.watch(collectionsProvider);
    NovelMeta? find() {
      for (final m in novels) {
        if (m.id == novelId) return m;
      }
      return null;
    }

    final meta = find();
    if (meta == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('This book is no longer in your library.')),
      );
    }

    final cs = Theme.of(context).colorScheme;
    final progress = meta.chapterCount == 0
        ? 0.0
        : (meta.lastReadChapter / meta.chapterCount).clamp(0.0, 1.0);
    final started = progress > 0;
    final finished = progress >= 1 && meta.chapterCount > 0;
    final bucket = meta.jlptStats?.difficultyBucket;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Details'),
        actions: [
          IconButton(
            tooltip: meta.favorite ? 'Unfavorite' : 'Favorite',
            icon: Icon(meta.favorite ? Icons.favorite : Icons.favorite_border,
                color: meta.favorite ? cs.error : null),
            onPressed: () =>
                ref.read(novelsProvider.notifier).toggleFavorite(meta.id),
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'remove') _confirmRemove(context, ref, meta);
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'remove', child: Text('Remove from library')),
            ],
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          // ── header ──
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(width: 120, child: BookCover(meta: meta, width: 120)),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(meta.title,
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w700, height: 1.2)),
                    if (meta.author != null && meta.author!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(meta.author!,
                            style: TextStyle(
                                fontSize: 14,
                                color: cs.onSurface.withValues(alpha: 0.7))),
                      ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        if (meta.contentType != null)
                          _InfoPill(label: _contentTypeLabel(meta.contentType!)),
                        _InfoPill(label: meta.sourceLanguage.toUpperCase()),
                        if (bucket != null)
                          JlptBadge(level: bucket, size: 11),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      finished
                          ? 'Finished'
                          : started
                              ? 'Reading · ${meta.lastReadChapter + 1}/${meta.chapterCount}'
                              : 'Not started · ${meta.chapterCount} chapters',
                      style: TextStyle(
                          fontSize: 12.5,
                          color: cs.onSurface.withValues(alpha: 0.7)),
                    ),
                    if (started && !finished)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                              value: progress, minHeight: 4),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // ── primary actions ──
          FilledButton.icon(
            onPressed: () => context.go('/reader/${meta.id}'),
            icon: Icon(started && !finished
                ? Icons.play_arrow
                : finished
                    ? Icons.replay
                    : Icons.menu_book),
            label: Text(started && !finished
                ? 'Continue reading'
                : finished
                    ? 'Read again'
                    : 'Start reading'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => _showCoverSheet(context, ref, meta),
            icon: const Icon(Icons.image_outlined),
            label: const Text('Change cover'),
          ),

          const SizedBox(height: 24),

          // ── collections ──
          _SectionHeader(
            title: 'Collections',
            trailing: TextButton.icon(
              onPressed: () => _newCollection(context, ref, meta),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('New'),
            ),
          ),
          if (collections.isEmpty)
            Text('No collections yet. Create one to group books like shelves.',
                style: TextStyle(
                    fontSize: 12.5, color: cs.onSurface.withValues(alpha: 0.6)))
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final c in collections)
                  FilterChip(
                    label: Text(c.name),
                    selected: (meta.collectionIds ?? const []).contains(c.id),
                    onSelected: (sel) {
                      final ids = {...(meta.collectionIds ?? const <String>[])};
                      if (sel) {
                        ids.add(c.id);
                      } else {
                        ids.remove(c.id);
                      }
                      ref
                          .read(novelsProvider.notifier)
                          .setCollections(meta.id, ids.toList());
                    },
                  ),
              ],
            ),

          const SizedBox(height: 24),

          // ── tags ──
          _SectionHeader(
            title: 'Tags',
            trailing: TextButton.icon(
              onPressed: () => _addTag(context, ref, meta),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add'),
            ),
          ),
          if ((meta.tags ?? const []).isEmpty)
            Text('No tags.',
                style: TextStyle(
                    fontSize: 12.5, color: cs.onSurface.withValues(alpha: 0.6)))
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final t in meta.tags!)
                  Chip(
                    label: Text(t),
                    onDeleted: () {
                      final next = [...meta.tags!]..remove(t);
                      ref.read(novelsProvider.notifier).setTags(meta.id, next);
                    },
                  ),
              ],
            ),

          const SizedBox(height: 24),

          // ── content type ──
          _SectionHeader(title: 'Type'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final c in ContentType.values)
                ChoiceChip(
                  label: Text(_contentTypeLabel(c)),
                  selected: meta.contentType == c,
                  onSelected: (sel) => ref
                      .read(novelsProvider.notifier)
                      .setContentType(meta.id, sel ? c : null),
                ),
            ],
          ),
        ],
      ),
    );
  }

  // ─────────── cover ───────────

  Future<void> _showCoverSheet(
      BuildContext context, WidgetRef ref, NovelMeta meta) async {
    await showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.search),
              title: const Text('Search online'),
              subtitle: const Text('Find cover art by title & author'),
              onTap: () {
                Navigator.pop(ctx);
                _searchCover(context, ref, meta);
              },
            ),
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('Paste image URL'),
              onTap: () {
                Navigator.pop(ctx);
                _pasteCoverUrl(context, ref, meta);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Pick from device'),
              onTap: () {
                Navigator.pop(ctx);
                _pickCoverFromDevice(context, ref, meta);
              },
            ),
            if (meta.coverUrl != null && meta.coverUrl!.isNotEmpty)
              ListTile(
                leading: const Icon(Icons.refresh),
                title: const Text('Reset to generated cover'),
                onTap: () async {
                  Navigator.pop(ctx);
                  await ref.read(novelsProvider.notifier).setCover(meta.id, null);
                  await LocalCoverStore.delete(meta.id);
                  ref.read(coverRevisionProvider.notifier).state++;
                },
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _searchCover(
      BuildContext context, WidgetRef ref, NovelMeta meta) async {
    final picked = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => _CoverSearchSheet(title: meta.title, author: meta.author),
    );
    if (picked != null) {
      await ref.read(novelsProvider.notifier).setCover(meta.id, picked);
    }
  }

  Future<void> _pasteCoverUrl(
      BuildContext context, WidgetRef ref, NovelMeta meta) async {
    final ctrl = TextEditingController(
        text: (meta.coverUrl != null && !isLocalCover(meta.coverUrl))
            ? meta.coverUrl
            : '');
    final url = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Image URL'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          keyboardType: TextInputType.url,
          decoration: const InputDecoration(hintText: 'https://…'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
              child: const Text('Set')),
        ],
      ),
    );
    if (url != null && url.isNotEmpty) {
      await ref.read(novelsProvider.notifier).setCover(meta.id, url);
    }
  }

  Future<void> _pickCoverFromDevice(
      BuildContext context, WidgetRef ref, NovelMeta meta) async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
    );
    if (res == null || res.files.isEmpty) return;
    final bytes = res.files.first.bytes;
    if (bytes == null) return;
    await LocalCoverStore.put(meta.id, bytes);
    await ref
        .read(novelsProvider.notifier)
        .setCover(meta.id, '$kLocalCoverScheme${meta.id}');
    ref.read(coverRevisionProvider.notifier).state++;
  }

  // ─────────── collections & tags ───────────

  Future<void> _newCollection(
      BuildContext context, WidgetRef ref, NovelMeta meta) async {
    final ctrl = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New collection'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'e.g. Mystery, JLPT N3'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
              child: const Text('Create')),
        ],
      ),
    );
    if (name == null || name.isEmpty) return;
    final id = await ref.read(collectionsProvider.notifier).create(name);
    final ids = {...(meta.collectionIds ?? const <String>[]), id};
    await ref.read(novelsProvider.notifier).setCollections(meta.id, ids.toList());
  }

  Future<void> _addTag(
      BuildContext context, WidgetRef ref, NovelMeta meta) async {
    final ctrl = TextEditingController();
    final tag = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add tag'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'e.g. romance'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
              child: const Text('Add')),
        ],
      ),
    );
    if (tag == null || tag.isEmpty) return;
    final next = {...(meta.tags ?? const <String>[]), tag}.toList();
    await ref.read(novelsProvider.notifier).setTags(meta.id, next);
  }

  Future<void> _confirmRemove(
      BuildContext context, WidgetRef ref, NovelMeta meta) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Remove "${meta.title}"?'),
        content: const Text(
            'This removes it from your library, along with any saved progress and translations.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton.tonal(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Remove')),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      await ref.read(novelsProvider.notifier).remove(meta.id);
      if (context.mounted) context.go('/');
    }
  }

  static String _contentTypeLabel(ContentType c) {
    switch (c) {
      case ContentType.news:
        return 'News';
      case ContentType.lightNovel:
        return 'Light novel';
      case ContentType.webNovel:
        return 'Web novel';
      case ContentType.shortStory:
        return 'Short story';
      case ContentType.novel:
        return 'Novel';
    }
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;
  const _SectionHeader({required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(title,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const Spacer(),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  final String label;
  const _InfoPill({required this.label});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}

/// Bottom sheet that searches Google Books for cover candidates and returns the
/// chosen image URL via `Navigator.pop`.
class _CoverSearchSheet extends ConsumerStatefulWidget {
  final String title;
  final String? author;
  const _CoverSearchSheet({required this.title, this.author});

  @override
  ConsumerState<_CoverSearchSheet> createState() => _CoverSearchSheetState();
}

class _CoverSearchSheetState extends ConsumerState<_CoverSearchSheet> {
  late final TextEditingController _ctrl =
      TextEditingController(text: widget.title);
  bool _loading = false;
  List<String> _results = const [];
  bool _searched = false;

  @override
  void initState() {
    super.initState();
    _run();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _run() async {
    setState(() => _loading = true);
    final svc = CoverService();
    try {
      final hits = await svc.search(_ctrl.text, author: widget.author);
      if (!mounted) return;
      setState(() {
        _results = hits.map((h) => h.thumbnailUrl).toList();
        _searched = true;
      });
    } finally {
      svc.close();
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      builder: (ctx, scrollCtrl) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => _run(),
                    decoration: const InputDecoration(
                      hintText: 'Search cover art',
                      isDense: true,
                    ),
                  ),
                ),
                IconButton(
                    onPressed: _loading ? null : _run,
                    icon: const Icon(Icons.search)),
              ],
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _results.isEmpty
                      ? Center(
                          child: Text(_searched
                              ? 'No covers found. Try a different title, or pick from device.'
                              : ''),
                        )
                      : GridView.builder(
                          controller: scrollCtrl,
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            childAspectRatio: 2 / 3,
                          ),
                          itemCount: _results.length,
                          itemBuilder: (ctx, i) {
                            final url = _results[i];
                            return InkWell(
                              onTap: () => Navigator.pop(context, url),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(6),
                                child: Image.network(url,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => const ColoredBox(
                                        color: Colors.black12,
                                        child: Icon(Icons.broken_image_outlined))),
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
}
