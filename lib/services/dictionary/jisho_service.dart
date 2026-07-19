import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../data/models/dict_entry.dart';
import '../../data/storage/storage.dart';
import 'jlpt_lookup.dart';

const _cachePrefix = 'jpdict:';
const _userAgent = 'LinguaPop/1.0 (Flutter)';

/// Live Japanese dictionary lookup against Jisho's public JMdict-derived API.
/// Per-query Hive cache, infinite TTL, with offline fallback to cached results.
class JishoService {
  final JlptLookup jlpt;

  JishoService(this.jlpt);

  /// Looks up a word, optionally trying a fallback (e.g. base then surface).
  Future<DictResult> lookupWord(String query, {String? fallback}) async {
    final primary = await _lookupOne(query);
    if (primary.entries.isNotEmpty) return primary;
    if (fallback != null && fallback != query && fallback.isNotEmpty) {
      return _lookupOne(fallback);
    }
    return primary;
  }

  Future<DictResult> _lookupOne(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      return DictResult(
          query: trimmed,
          entries: const [],
          fetchedAt: DateTime.now().millisecondsSinceEpoch);
    }

    final cacheKey = '$_cachePrefix$trimmed';
    final cached = _readCache(cacheKey);
    if (cached != null) return cached;

    DictResult fresh;
    try {
      fresh = await _fetchFromJisho(trimmed);
    } catch (_) {
      if (cached != null) return cached;
      rethrow;
    }
    if (fresh.entries.isNotEmpty) {
      await Storage.jpdict().put(cacheKey, jsonEncode(fresh.toJson()));
      _feedIntoJlptMap(trimmed, fresh);
    }
    return fresh;
  }

  DictResult? _readCache(String cacheKey) {
    final raw = Storage.jpdict().get(cacheKey);
    if (raw is String && raw.isNotEmpty) {
      try {
        return DictResult.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      } catch (_) {/* fall through */}
    }
    return null;
  }

  Future<DictResult> _fetchFromJisho(String query) async {
    final url = Uri.parse(
        'https://jisho.org/api/v1/search/words?keyword=${Uri.encodeQueryComponent(query)}');
    final res = await http
        .get(url, headers: {'User-Agent': _userAgent})
        .timeout(const Duration(seconds: 12));
    if (res.statusCode != 200) {
      throw http.ClientException(
          'Dictionary lookup failed (HTTP ${res.statusCode})');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final raw = (data['data'] as List?) ?? const [];

    final entries = <DictEntry>[];
    for (final d in raw.take(6)) {
      final m = d as Map<String, dynamic>;
      final japanese = (m['japanese'] as List?) ?? const [];
      final first = japanese.isEmpty
          ? <String, dynamic>{}
          : Map<String, dynamic>.from(japanese.first as Map);
      final word = (first['word'] as String?) ??
          (first['reading'] as String?) ??
          (m['slug'] as String? ?? '');
      final readings = <String>{};
      for (final j in japanese) {
        final r = (j as Map)['reading'];
        if (r is String && r.isNotEmpty) readings.add(r);
      }
      final senses = <DictSense>[];
      for (final s in (m['senses'] as List? ?? const []).take(5)) {
        final sm = s as Map;
        final defs = ((sm['english_definitions'] as List?) ?? const [])
            .cast<String>();
        if (defs.isEmpty) continue;
        senses.add(DictSense(
          partsOfSpeech:
              ((sm['parts_of_speech'] as List?) ?? const []).cast<String>(),
          definitions: defs,
          tags: ((sm['tags'] as List?) ?? const []).cast<String>(),
        ));
      }
      if (senses.isEmpty) continue;
      entries.add(DictEntry(
        word: word,
        readings: readings.toList(),
        isCommon: m['is_common'] == true,
        jlptLevel: _parseJlptLevel((m['jlpt'] as List?)?.cast<String>()),
        senses: senses,
      ));
    }

    return DictResult(
      query: query,
      entries: entries,
      fetchedAt: DateTime.now().millisecondsSinceEpoch,
    );
  }

  int? _parseJlptLevel(List<String>? tags) {
    if (tags == null) return null;
    int? best;
    final re = RegExp(r'jlpt-n([1-5])', caseSensitive: false);
    for (final t in tags) {
      final m = re.firstMatch(t);
      if (m != null) {
        final lvl = int.parse(m.group(1)!);
        if (best == null || lvl > best) best = lvl;
      }
    }
    return best;
  }

  /// Merge a Jisho result into the in-memory JLPT lookup map so any word the
  /// user has previously hovered gets colorized on subsequent reads.
  void _feedIntoJlptMap(String query, DictResult result) {
    final additions = <({String key, int level, String? gloss})>[];
    for (final e in result.entries) {
      if (e.jlptLevel == null) continue;
      final gloss = e.senses.isEmpty || e.senses.first.definitions.isEmpty
          ? null
          : e.senses.first.definitions.first;
      if (e.word.isNotEmpty) {
        additions.add((key: e.word, level: e.jlptLevel!, gloss: gloss));
      }
      for (final r in e.readings) {
        if (r.isNotEmpty && r != e.word) {
          additions.add((key: r, level: e.jlptLevel!, gloss: gloss));
        }
      }
    }
    final topJlpt = result.entries.firstWhere(
      (e) => e.jlptLevel != null,
      orElse: () => const DictEntry(word: ''),
    );
    if (topJlpt.jlptLevel != null) {
      final gloss = topJlpt.senses.isEmpty ||
              topJlpt.senses.first.definitions.isEmpty
          ? null
          : topJlpt.senses.first.definitions.first;
      additions.add((key: query, level: topJlpt.jlptLevel!, gloss: gloss));
    }
    if (additions.isNotEmpty) jlpt.register(additions);
  }

  /// Scan the cache at app startup and fold every previously-cached Jisho
  /// result into the JLPT lookup map.
  Future<int> warmJlptFromCache() async {
    final box = Storage.jpdict();
    var merged = 0;
    for (final key in box.keys) {
      if (key is! String || !key.startsWith(_cachePrefix)) continue;
      final cached = _readCache(key);
      if (cached == null || cached.entries.isEmpty) continue;
      if (cached.entries.any((e) => e.jlptLevel != null)) {
        final query = key.substring(_cachePrefix.length);
        _feedIntoJlptMap(query, cached);
        merged++;
      }
    }
    return merged;
  }
}
