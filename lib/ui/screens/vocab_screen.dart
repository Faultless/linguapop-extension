import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/vocab_entry.dart';
import '../../providers/vocab_provider.dart';
import '../../services/export/vocab_export.dart';
import '../widgets/jlpt_badge.dart';

enum _VocabSort { recent, alpha, jlpt }

class VocabScreen extends ConsumerStatefulWidget {
  const VocabScreen({super.key});
  @override
  ConsumerState<VocabScreen> createState() => _VocabScreenState();
}

class _VocabScreenState extends ConsumerState<VocabScreen> {
  String _query = '';
  _VocabSort _sort = _VocabSort.recent;
  bool _exporting = false;

  @override
  Widget build(BuildContext context) {
    final all = ref.watch(vocabProvider);
    final entries = _filterAndSort(all);

    return Scaffold(
      appBar: AppBar(
        title: Text('Vocab (${all.length})'),
        actions: [
          PopupMenuButton<_VocabSort>(
            tooltip: 'Sort',
            icon: const Icon(Icons.sort),
            onSelected: (s) => setState(() => _sort = s),
            itemBuilder: (ctx) => [
              for (final s in _VocabSort.values)
                PopupMenuItem(
                  value: s,
                  child: Row(children: [
                    Icon(s == _sort ? Icons.check : Icons.circle_outlined,
                        size: 16),
                    const SizedBox(width: 8),
                    Text(_sortLabel(s)),
                  ]),
                ),
            ],
          ),
          IconButton(
            tooltip: 'Export to AnkiDroid',
            icon: _exporting
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : const Icon(Icons.ios_share),
            onPressed: all.isEmpty || _exporting ? null : _openExportSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          if (all.isNotEmpty) _SearchBar(onChanged: (v) => setState(() => _query = v.trim())),
          Expanded(
            child: entries.isEmpty
                ? _EmptyState(hasQuery: _query.isNotEmpty)
                : ListView.separated(
                    itemCount: entries.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (ctx, i) {
                      final e = entries[i];
                      return Dismissible(
                        key: ValueKey(e.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          color: Theme.of(context).colorScheme.error,
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Icon(Icons.delete,
                              color: Theme.of(context).colorScheme.onError),
                        ),
                        confirmDismiss: (_) async => _confirmDelete(e),
                        onDismissed: (_) =>
                            ref.read(vocabProvider.notifier).remove(e.id),
                        child: _VocabTile(entry: e),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  List<VocabEntry> _filterAndSort(List<VocabEntry> all) {
    final q = _query.toLowerCase();
    final list = q.isEmpty
        ? [...all]
        : all.where((e) {
            return e.surface.toLowerCase().contains(q) ||
                e.base.toLowerCase().contains(q) ||
                (e.reading?.toLowerCase().contains(q) ?? false) ||
                e.glosses.any((g) => g.toLowerCase().contains(q));
          }).toList();
    switch (_sort) {
      case _VocabSort.recent:
        list.sort((a, b) => b.addedAt.compareTo(a.addedAt));
      case _VocabSort.alpha:
        list.sort((a, b) => a.surface.compareTo(b.surface));
      case _VocabSort.jlpt:
        // Easier first (higher level number = easier). Unknown last.
        list.sort((a, b) {
          final al = a.jlptLevel ?? 0;
          final bl = b.jlptLevel ?? 0;
          if (al == bl) return b.addedAt.compareTo(a.addedAt);
          return bl.compareTo(al);
        });
    }
    return list;
  }

  String _sortLabel(_VocabSort s) {
    switch (s) {
      case _VocabSort.recent:
        return 'Recently added';
      case _VocabSort.alpha:
        return 'A → Z';
      case _VocabSort.jlpt:
        return 'JLPT level (N5 first)';
    }
  }

  Future<bool> _confirmDelete(VocabEntry e) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Remove "${e.surface}"?'),
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
    return ok == true;
  }

  Future<void> _openExportSheet() async {
    final exporter = ref.read(vocabExporterProvider);
    final all = ref.read(vocabProvider);
    final lastExportedAt = exporter.lastExportedAt;
    final unexportedCount = lastExportedAt == null
        ? all.length
        : all.where((e) => e.addedAt > lastExportedAt).length;

    final choice = await showModalBottomSheet<_ExportChoice>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Text('Export to AnkiDroid',
                    style: TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w700)),
              ),
              ListTile(
                leading: const Icon(Icons.style_outlined),
                title: Text('Everything (${all.length} entries)'),
                subtitle: const Text('Tab-separated values, UTF-8 with BOM'),
                onTap: () => Navigator.pop(ctx, _ExportChoice.all),
              ),
              if (lastExportedAt != null)
                ListTile(
                  leading: const Icon(Icons.update),
                  title: Text('New since last export ($unexportedCount entries)'),
                  subtitle: Text('Since ${_formatDate(lastExportedAt)}'),
                  enabled: unexportedCount > 0,
                  onTap: unexportedCount == 0
                      ? null
                      : () => Navigator.pop(ctx, _ExportChoice.newSinceLast),
                ),
              ListTile(
                leading: const Icon(Icons.view_headline),
                title: const Text('Everything, with header row'),
                onTap: () => Navigator.pop(ctx, _ExportChoice.allWithHeader),
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
    if (choice == null) return;
    await _runExport(choice, lastExportedAt);
  }

  Future<void> _runExport(_ExportChoice choice, int? lastExportedAt) async {
    setState(() => _exporting = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      final opts = switch (choice) {
        _ExportChoice.all => const ExportOptions(),
        _ExportChoice.allWithHeader => const ExportOptions(header: true),
        _ExportChoice.newSinceLast =>
          ExportOptions(since: (lastExportedAt ?? 0) + 1),
      };
      final result = await ref.read(vocabExporterProvider).exportAll(opts: opts);
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(
        content: Text(result.shared
            ? 'Exported ${result.exportedIds.length} entries.'
            : 'Share cancelled.'),
      ));
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text('Export failed: $e')));
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }
}

enum _ExportChoice { all, allWithHeader, newSinceLast }

class _SearchBar extends StatelessWidget {
  final ValueChanged<String> onChanged;
  const _SearchBar({required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      child: TextField(
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: 'Filter…',
          prefixIcon: const Icon(Icons.search),
          isDense: true,
          filled: true,
          fillColor: cs.onSurface.withValues(alpha: 0.05),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }
}

class _VocabTile extends StatelessWidget {
  final VocabEntry entry;
  const _VocabTile({required this.entry});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final hasExported = entry.exportedAt != null;
    return ListTile(
      title: Row(
        children: [
          Flexible(
            child: Text(
              entry.surface,
              style: const TextStyle(
                  fontSize: 18, fontWeight: FontWeight.w600, height: 1.15),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (entry.reading != null && entry.reading != entry.surface)
            Padding(
              padding: const EdgeInsets.only(left: 8),
              child: Text(
                entry.reading!,
                style: TextStyle(
                    fontSize: 12,
                    color: cs.onSurface.withValues(alpha: 0.65)),
              ),
            ),
        ],
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 2),
        child: Text(
          entry.glosses.isEmpty
              ? '(no glosses)'
              : entry.glosses.join('; '),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
              fontSize: 13,
              height: 1.35,
              color: cs.onSurface.withValues(alpha: 0.75)),
        ),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (entry.jlptLevel != null)
            JlptBadge(level: entry.jlptLevel!),
          if (hasExported)
            Padding(
              padding: const EdgeInsets.only(left: 6),
              child: Icon(Icons.cloud_done_outlined,
                  size: 16, color: cs.onSurface.withValues(alpha: 0.45)),
            ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final bool hasQuery;
  const _EmptyState({required this.hasQuery});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.style_outlined,
                size: 56, color: cs.primary.withValues(alpha: 0.7)),
            const SizedBox(height: 14),
            Text(
              hasQuery ? 'No matches.' : 'No saved words yet',
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            Text(
              hasQuery
                  ? 'Try a different word, reading, or definition.'
                  : 'Tap a Japanese word in the reader and choose "Save to vocab" to start collecting.',
              textAlign: TextAlign.center,
              style: TextStyle(color: cs.onSurface.withValues(alpha: 0.7)),
            ),
          ],
        ),
      ),
    );
  }
}

String _formatDate(int ms) {
  final dt = DateTime.fromMillisecondsSinceEpoch(ms);
  return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
}
