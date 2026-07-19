/// Single page inside a chapter — a slice of paragraphs whose combined length
/// is below `pageCharLimit` (or, when one paragraph is already larger, a
/// single-paragraph page).
class ChapterPage {
  /// Paragraphs in the original (source-language) view, in order.
  final List<String> originalParagraphs;
  /// Paragraphs in the translated view, aligned 1-to-1 with [originalParagraphs]
  /// (some entries may be null when a translation paragraph is missing).
  final List<String?> translatedParagraphs;

  /// Index of the first paragraph (within the full paragraph list of the
  /// chapter) that this page covers. Used so the reader can persist a
  /// finer-grained scroll position than "current page only".
  final int startIndex;

  const ChapterPage({
    required this.originalParagraphs,
    required this.translatedParagraphs,
    required this.startIndex,
  });
}

/// Split [original] / [translated] paragraph lists into pages of at most
/// [pageCharLimit] characters each, greedy-packed by paragraph. Each page
/// always contains whole paragraphs; one paragraph that is already over the
/// limit gets its own (oversized) page. The two paragraph lists may differ
/// in length — extras on either side are paired with `null` on the other.
List<ChapterPage> paginateChapter({
  required List<String> original,
  required List<String> translated,
  required int pageCharLimit,
}) {
  // Align the two lists by index; pad the shorter one with empties.
  final n = original.length > translated.length
      ? original.length
      : translated.length;
  if (n == 0) return const [];

  final pages = <ChapterPage>[];
  var curOrig = <String>[];
  var curTrans = <String?>[];
  var curStart = 0;
  var curLen = 0;

  void flush() {
    if (curOrig.isEmpty && curTrans.every((t) => t == null || t.isEmpty)) {
      return;
    }
    pages.add(ChapterPage(
      originalParagraphs: curOrig,
      translatedParagraphs: curTrans,
      startIndex: curStart,
    ));
    curOrig = <String>[];
    curTrans = <String?>[];
    curLen = 0;
  }

  for (var i = 0; i < n; i++) {
    final o = i < original.length ? original[i] : '';
    final t = i < translated.length ? translated[i] : null;
    final paragraphLen = o.length + (t?.length ?? 0);

    if (curLen > 0 && curLen + paragraphLen > pageCharLimit) {
      flush();
      curStart = i;
    } else if (curOrig.isEmpty && curTrans.isEmpty) {
      curStart = i;
    }
    curOrig.add(o);
    curTrans.add(t);
    curLen += paragraphLen;
  }
  flush();
  return pages;
}

/// Split a chapter's prose into paragraphs at blank lines, dropping empty
/// entries. Pulled out so the reader and paginator share the same definition.
List<String> splitParagraphs(String text) {
  if (text.isEmpty) return const [];
  return text
      .split(RegExp(r'\n\s*\n'))
      .where((s) => s.trim().isNotEmpty)
      .toList(growable: false);
}
