import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../data/models/vocab_entry.dart';
import '../../providers/vocab_provider.dart';

/// Vocab list → AnkiDroid export.
///
/// Format: tab-separated values, one row per entry. AnkiDroid's "Import →
/// text file" flow consumes this directly; columns are designed so the user
/// can map them onto the Basic note type during import:
///
///   1. Front           — kanji surface (or base if no kanji)
///   2. Reading         — kana reading
///   3. Back            — semicolon-joined English glosses
///   4. PartsOfSpeech   — comma-joined
///   5. Example         — the sentence the word was tapped in
///   6. Source          — novel title / URL
///   7. Tags            — space-separated (AnkiDroid convention)
///
/// UTF-8 with a leading BOM so Excel + AnkiDroid agree on encoding.
/// Each field is sanitized to a single line — tabs are replaced with spaces
/// and any newline collapses, so every entry is exactly one TSV row.

class ExportOptions {
  /// Only include entries added after this timestamp (ms-since-epoch).
  final int? since;
  /// Include a header row. AnkiDroid accepts but doesn't require it.
  final bool header;
  const ExportOptions({this.since, this.header = false});
}

String _tsvField(String? s) {
  if (s == null || s.isEmpty) return '';
  return s.replaceAll('\t', ' ').replaceAll(RegExp(r'\r?\n'), ' ').trim();
}

String toTsv(Iterable<VocabEntry> entries, [ExportOptions opts = const ExportOptions()]) {
  final filtered = opts.since == null
      ? entries
      : entries.where((e) => e.addedAt >= opts.since!);
  final lines = <String>[];
  if (opts.header) {
    lines.add([
      'Front',
      'Reading',
      'Back',
      'PartsOfSpeech',
      'Example',
      'Source',
      'Tags',
    ].join('\t'));
  }
  for (final e in filtered) {
    final front = e.surface.isNotEmpty ? e.surface : e.base;
    final back = e.glosses.join('; ');
    final source = [e.sourceNovelTitle, e.sourceUrl]
        .where((s) => s != null && s.isNotEmpty)
        .join(' — ');
    final tags = (e.tags ?? const <String>[]).join(' ');
    lines.add([
      _tsvField(front),
      _tsvField(e.reading),
      _tsvField(back),
      _tsvField((e.partsOfSpeech ?? const <String>[]).join(', ')),
      _tsvField(e.exampleSentence),
      _tsvField(source),
      _tsvField(tags),
    ].join('\t'));
  }
  return '${lines.join('\n')}\n';
}

class ExportResult {
  final String filename;
  final List<String> exportedIds;
  final bool shared;
  const ExportResult({
    required this.filename,
    required this.exportedIds,
    required this.shared,
  });
}

class VocabExporter {
  final VocabNotifier _vocab;
  VocabExporter(this._vocab);

  /// Build a TSV from the current vocab list and hand it off to the native
  /// share sheet (AnkiDroid will show up there on Android). After a
  /// successful share, marks every exported entry with `exportedAt = now`.
  Future<ExportResult> exportAll({ExportOptions opts = const ExportOptions()}) async {
    final entries = _vocab.all;
    final filtered = opts.since == null
        ? entries
        : entries.where((e) => e.addedAt >= opts.since!).toList();
    if (filtered.isEmpty) {
      throw StateError('No vocab entries to export.');
    }

    final tsvBody = toTsv(filtered, opts);
    // Prepend UTF-8 BOM so Excel + AnkiDroid agree on encoding.
    final bytes = Uint8List.fromList([0xEF, 0xBB, 0xBF, ...tsvBody.codeUnits]);

    final stamp = DateTime.now().toIso8601String().substring(0, 10);
    final filename = 'linguapop-vocab-$stamp.tsv';
    final tmp = await getTemporaryDirectory();
    final file = File(p.join(tmp.path, filename));
    await file.writeAsBytes(bytes, flush: true);

    final shareResult = await Share.shareXFiles(
      [XFile(file.path, mimeType: 'text/tab-separated-values')],
      subject: 'LinguaPop vocab',
      text: '${filtered.length} entries',
    );

    final shared = shareResult.status == ShareResultStatus.success;
    if (shared) {
      final now = DateTime.now().millisecondsSinceEpoch;
      for (final e in filtered) {
        e.exportedAt = now;
        await _vocab.upsert(e);
      }
    }

    return ExportResult(
      filename: filename,
      exportedIds: filtered.map((e) => e.id).toList(),
      shared: shared,
    );
  }

  /// Most recent `exportedAt` across the list, or `null` if nothing has been
  /// exported yet. Used by the UI to surface an "Export new since last export"
  /// option.
  int? get lastExportedAt {
    int? latest;
    for (final e in _vocab.all) {
      final t = e.exportedAt;
      if (t != null && (latest == null || t > latest)) latest = t;
    }
    return latest;
  }
}

final vocabExporterProvider = Provider<VocabExporter>(
    (ref) => VocabExporter(ref.read(vocabProvider.notifier)));
