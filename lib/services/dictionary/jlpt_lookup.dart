import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

class JlptHit {
  final int level; // 1..5 (5 = easiest, 1 = hardest)
  final String? gloss;
  const JlptHit({required this.level, this.gloss});
}

/// Bundled-JLPT lookup. Loads two assets at app start:
///   * assets/jlpt/vocab.json    — ~8k entries from the Tanos / Jonathan Waller
///                                  list; tuple of (expression, reading, level, gloss).
///   * assets/jlpt/starter.json  — ~300 curated common entries (particles,
///                                  kana words) keyed by comma-separated surfaces.
///
/// Both expand to a single `String → JlptHit` map. When the same key exists at
/// multiple levels we keep the easier (higher number).
class JlptLookup {
  final Map<String, JlptHit> _map = {};
  bool _loaded = false;
  final List<void Function()> _listeners = [];

  bool get isLoaded => _loaded;
  int get size => _map.length;

  Future<void> load() async {
    if (_loaded) return;
    await Future.wait([
      _loadFullVocab(),
      _loadStarter(),
    ]);
    _loaded = true;
    _notify();
  }

  Future<void> _loadFullVocab() async {
    try {
      final raw = await rootBundle.loadString('assets/jlpt/vocab.json');
      final list = jsonDecode(raw) as List;
      for (final e in list) {
        final m = e as Map<String, dynamic>;
        final level = (m['n'] as num).toInt();
        final gloss = m['g'] as String?;
        _put(m['k'] as String, level, gloss);
        final reading = m['r'] as String?;
        if (reading != null && reading.isNotEmpty) {
          _put(reading, level, gloss);
        }
      }
    } catch (_) {/* asset missing — fall through */}
  }

  Future<void> _loadStarter() async {
    try {
      final raw = await rootBundle.loadString('assets/jlpt/starter.json');
      final list = jsonDecode(raw) as List;
      for (final e in list) {
        final m = e as Map<String, dynamic>;
        final level = (m['n'] as num).toInt();
        final gloss = m['g'] as String?;
        final keys = (m['k'] as String).split(',');
        for (final k in keys) {
          final t = k.trim();
          if (t.isNotEmpty) _put(t, level, gloss);
        }
      }
    } catch (_) {}
  }

  void _put(String key, int level, String? gloss) {
    final existing = _map[key];
    // Prefer the easier-level entry when duplicates exist (higher N number).
    if (existing != null && existing.level >= level) return;
    _map[key] = JlptHit(level: level, gloss: gloss);
  }

  /// Looks up the JLPT level for a token, trying base → surface → reading.
  JlptHit? lookup({String? base, String? surface, String? reading}) {
    JlptHit? hit;
    for (final k in [base, surface, reading]) {
      if (k == null || k.isEmpty) continue;
      hit = _map[k];
      if (hit != null) return hit;
    }
    return null;
  }

  /// Merge entries from an external source (e.g. cached Jisho lookups) into
  /// the live map. Notifies listeners exactly once if anything was added.
  void register(Iterable<({String key, int level, String? gloss})> entries) {
    var changed = false;
    for (final e in entries) {
      if (e.key.isEmpty) continue;
      final existing = _map[e.key];
      if (existing != null && existing.level >= e.level) continue;
      _map[e.key] = JlptHit(level: e.level, gloss: e.gloss);
      changed = true;
    }
    if (changed) _notify();
  }

  /// Subscribe to mutations of the lookup map (e.g. when Jisho fills in a
  /// previously-grey word). Returns an unsubscribe function.
  void Function() addListener(void Function() cb) {
    _listeners.add(cb);
    return () => _listeners.remove(cb);
  }

  void _notify() {
    for (final cb in List.of(_listeners)) {
      cb();
    }
  }
}
