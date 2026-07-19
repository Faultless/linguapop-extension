import '../../data/models/jp_token.dart';

/// LRU cache mapping raw paragraph text → tokenized output. Saves us from
/// re-invoking MeCab's FFI bridge on every rebuild when paragraphs are
/// recycled by [ListView.builder] or when the user flips pages back and forth.
///
/// Sized for "long chapter still fits comfortably" — 1500 entries holds about
/// 30 chapters worth of paragraphs in our tests. Eviction is recency-based:
/// the least-recently-accessed entry gets dropped first.
class JpTokenCache {
  static const _maxEntries = 1500;

  /// LinkedHashMap-style: re-inserting on access moves the key to the end,
  /// so the iteration order is oldest → newest.
  final Map<String, List<JpToken>> _store = <String, List<JpToken>>{};

  List<JpToken>? get(String text) {
    final hit = _store.remove(text);
    if (hit == null) return null;
    _store[text] = hit; // move to MRU position
    return hit;
  }

  void put(String text, List<JpToken> tokens) {
    if (_store.containsKey(text)) {
      _store
        ..remove(text)
        ..[text] = tokens;
      return;
    }
    if (_store.length >= _maxEntries) {
      _store.remove(_store.keys.first);
    }
    _store[text] = tokens;
  }

  void clear() => _store.clear();
  int get length => _store.length;
}
