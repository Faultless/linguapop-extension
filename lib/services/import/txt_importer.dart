import 'package:uuid/uuid.dart';

import '../../data/models/chapter.dart';

const _uuid = Uuid();

final _chapterRe = RegExp(
  r'^\s*(?:chapter|ch\.?|prologue|epilogue|part|book|第\s*[\d一二三四五六七八九十百千]+\s*[章話回部]|\d+\.\s+\S)',
  caseSensitive: false,
);
final _headingRe = RegExp(r'^#{1,3}\s+\S');

/// Heuristically split a plain-text novel into chapters. Order of preference:
///   1. Lines matching `Chapter \d`, `Ch.\d`, `第N章` etc.
///   2. Markdown-style headings (`# `, `## `, `### `).
///   3. Triple-dash separators `---` / `***`.
///   4. Three+ blank lines.
/// If none of those fire, the whole text becomes a single chapter.
List<Chapter> splitTxtIntoChapters(String text,
    {String fallbackTitle = 'Untitled'}) {
  final normalized = text.replaceAll(RegExp(r'\r\n?'), '\n').trim();
  if (normalized.isEmpty) return [];

  final lines = normalized.split('\n');
  final starts = <int>[];
  var blankRun = 0;

  for (var i = 0; i < lines.length; i++) {
    final line = lines[i];
    if (line.trim().isEmpty) {
      blankRun++;
      continue;
    }
    final trimmed = line.trim();
    final isBoundary = _chapterRe.hasMatch(line) ||
        _headingRe.hasMatch(line) ||
        trimmed == '---' ||
        trimmed == '***' ||
        (blankRun >= 3 && i > 0);
    if (isBoundary) starts.add(i);
    blankRun = 0;
  }

  if (starts.length < 2) {
    return [
      Chapter(
        id: _uuid.v4(),
        title: fallbackTitle,
        originalText: normalized,
      )
    ];
  }

  final boundaries = starts.first == 0 ? starts : [0, ...starts];
  final chapters = <Chapter>[];
  for (var i = 0; i < boundaries.length; i++) {
    final start = boundaries[i];
    final end = i + 1 < boundaries.length ? boundaries[i + 1] : lines.length;
    final block = lines.sublist(start, end).join('\n').trim();
    if (block.isEmpty) continue;
    final firstLine = lines[start].replaceFirst(RegExp(r'^#+\s*'), '').trim();
    final title = (firstLine.isEmpty ? 'Chapter ${i + 1}' : firstLine);
    final body = () {
      final after = block.split('\n').skip(1).join('\n').trim();
      return after.isEmpty ? block : after;
    }();
    chapters.add(Chapter(
      id: _uuid.v4(),
      title: title.length > 120 ? title.substring(0, 120) : title,
      originalText: body,
    ));
  }
  return chapters;
}
