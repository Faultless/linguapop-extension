import '../../data/models/chapter.dart';

final _skipTitleRe = RegExp(
  r'^\s*(?:' +
      [
        'cover',
        r'title\s*page',
        r'front\s*matter',
        r'back\s*matter',
        r'half\s*title',
        'copyright',
        'colophon',
        'imprint',
        r'publishing\s*information',
        r'legal\s*notice',
        'disclaimer',
        'dedication',
        r'acknowledg(?:e?ments?)',
        'thanks',
        'preface',
        'foreword',
        'afterword',
        r'about\s+the\s+(?:author|book|series|translator)',
        r"author'?s?\s+note",
        r"translator'?s?\s+note",
        r'note\s+from\s+the\s+(?:author|translator)',
        r'other\s+(?:books|works)\s+by',
        r'by\s+the\s+same\s+author',
        r'also\s+by',
        r'praise\s+for',
        r'advance\s+praise',
        'reviews',
        r'table\s+of\s+contents',
        'contents',
        'toc',
        'index',
        'glossary',
        'bibliography',
        'references',
        'notes',
        'footnotes',
        'endnotes',
        r'appendix(?:es|\s+[A-Z])?',
        'illustrations?',
        'maps?',
        r'character\s+list',
        r'dramatis\s+personae',
        r'sample\s+chapter',
        'preview',
        'excerpt',
        'newsletter',
        r'mailing\s+list',
        r'connect\s+with',
        r'follow\s+me',
        r'social\s+media',
      ].join('|') +
      r')\s*$',
  caseSensitive: false,
);

final _skipBodyRegexes = <RegExp>[
  RegExp(r'\ball rights reserved\b', caseSensitive: false),
  RegExp(r'\bisbn[\s-]*\d', caseSensitive: false),
  RegExp(r'\blibrary of congress\b', caseSensitive: false),
  RegExp(r'\bfirst (?:published|edition|printing|impression)\b',
      caseSensitive: false),
  RegExp(r'\bcopyright\s*(?:©|\([cC]\))?\s*\d{4}\b', caseSensitive: false),
  RegExp(r'©\s*\d{4}.{0,80}all rights', caseSensitive: false),
  RegExp(
      r'\bprinted in (?:the\s+)?(?:united\s+states|usa|uk|china|canada)\b',
      caseSensitive: false),
  RegExp(r'\bpublished by\b[^\n]{0,80}(?:press|books|publishing|house)\b',
      caseSensitive: false),
  RegExp(r'\b(?:this is a work of fiction|any resemblance to actual)\b',
      caseSensitive: false),
  RegExp(r'\bno part of this (?:book|publication) may be reproduced\b',
      caseSensitive: false),
];

final _chapterLineRe = RegExp(
  r'^\s*(?:chapter|ch\.?|part|book|prologue|epilogue|interlude|第\s*[\d一二三四五六七八九十百千]+\s*[章話回部]|\d{1,3}[\.:）)])\s',
  caseSensitive: false,
);

int _countWords(String text) {
  final m = RegExp(r'\p{L}+', unicode: true).allMatches(text);
  return m.length;
}

bool _looksLikeToc(String text) {
  final lines = text
      .split('\n')
      .map((l) => l.trim())
      .where((l) => l.isNotEmpty)
      .toList();
  if (lines.length < 4) return false;
  var chapterLike = 0;
  var short = 0;
  for (final line in lines) {
    if (_chapterLineRe.hasMatch(line)) chapterLike++;
    if (line.length <= 80) short++;
  }
  return chapterLike / lines.length > 0.5 && short / lines.length > 0.8;
}

bool _looksLikeLinkDump(String text) {
  final urls = RegExp(r'https?:\/\/', caseSensitive: false).allMatches(text).length;
  final ats = RegExp(r'@[A-Za-z0-9_]+').allMatches(text).length;
  return urls + ats >= 4 && _countWords(text) < 400;
}

/// Strip frontmatter, backmatter, and other non-prose chapters.
List<Chapter> pruneNovel(List<Chapter> chapters, {int minWords = 120}) {
  return chapters.where((c) {
    final title = c.title.trim();
    final body = c.originalText;
    if (_skipTitleRe.hasMatch(title)) return false;
    if (_looksLikeToc(body)) return false;
    if (_looksLikeLinkDump(body)) return false;
    final hits = _skipBodyRegexes.any((re) => re.hasMatch(body));
    if (hits && _countWords(body) < 400) return false;
    if (_countWords(body) < minWords) return false;
    return true;
  }).toList();
}

/// Align a list of original chapters with a list of translated chapters.
/// Pairs by index when lengths match; otherwise greedy title-similarity match.
/// Originals with no match >= 0.3 keep an empty translation.
List<Chapter> alignChapters(
    List<Chapter> originals, List<Chapter> translations) {
  if (originals.isEmpty) return [];
  if (translations.isEmpty) return originals;

  if (originals.length == translations.length) {
    return [
      for (var i = 0; i < originals.length; i++)
        Chapter(
          id: originals[i].id,
          title: originals[i].title,
          originalText: originals[i].originalText,
          translatedText: translations[i].originalText,
          translationStatus: TranslationStatus.translated,
        ),
    ];
  }

  final used = <int>{};
  return [
    for (final o in originals)
      () {
        var bestIdx = -1;
        var bestScore = 0.0;
        for (var j = 0; j < translations.length; j++) {
          if (used.contains(j)) continue;
          final score = _titleSimilarity(o.title, translations[j].title);
          if (score > bestScore) {
            bestScore = score;
            bestIdx = j;
          }
        }
        if (bestIdx >= 0 && bestScore >= 0.3) {
          used.add(bestIdx);
          return Chapter(
            id: o.id,
            title: o.title,
            originalText: o.originalText,
            translatedText: translations[bestIdx].originalText,
            translationStatus: TranslationStatus.translated,
          );
        }
        return o;
      }(),
  ];
}

double _titleSimilarity(String a, String b) {
  String norm(String s) => s
      .toLowerCase()
      .replaceFirst(
          RegExp(
              r'^\s*(?:chapter|ch\.?|part|book|prologue|epilogue|interlude|第)\s*[\d一二三四五六七八九十百千]+[\.:：、]?\s*',
              caseSensitive: false),
          '')
      .replaceAll(RegExp(r'[^\p{L}\p{N}\s]', unicode: true), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();

  final A = norm(a);
  final B = norm(b);
  if (A.isEmpty || B.isEmpty) {
    final aNum = RegExp(r'\d+').firstMatch(a)?.group(0);
    final bNum = RegExp(r'\d+').firstMatch(b)?.group(0);
    if (aNum != null && aNum == bNum) return 1;
    return 0;
  }

  final aw = A.split(' ').toSet();
  final bw = B.split(' ').toSet();
  var inter = 0;
  for (final w in aw) {
    if (bw.contains(w)) inter++;
  }
  final union = {...aw, ...bw};
  return union.isEmpty ? 0 : inter / union.length;
}
