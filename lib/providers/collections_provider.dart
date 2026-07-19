import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../data/models/collection.dart';
import '../data/storage/storage.dart';

const _collectionsKey = 'collections';
const _uuid = Uuid();

/// User-defined library shelves. Persisted as a JSON list in the `prefs` box so
/// it migrates alongside the rest of the lightweight settings.
class CollectionsNotifier extends StateNotifier<List<Collection>> {
  CollectionsNotifier() : super(_load());

  static List<Collection> _load() {
    try {
      final raw = Storage.prefs().get(_collectionsKey);
      if (raw is String && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          return decoded
              .map((j) =>
                  Collection.fromJson(Map<String, dynamic>.from(j as Map)))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<void> _persist() async {
    await Storage.prefs()
        .put(_collectionsKey, jsonEncode(state.map((c) => c.toJson()).toList()));
  }

  Collection? byId(String id) {
    for (final c in state) {
      if (c.id == id) return c;
    }
    return null;
  }

  /// Creates a collection (or returns the existing one if a collection with the
  /// same name already exists, case-insensitively). Returns its id.
  Future<String> create(String name) async {
    final trimmed = name.trim();
    final existing = state.firstWhere(
      (c) => c.name.toLowerCase() == trimmed.toLowerCase(),
      orElse: () => Collection(id: '', name: '', createdAt: 0),
    );
    if (existing.id.isNotEmpty) return existing.id;
    final c = Collection(
      id: _uuid.v4(),
      name: trimmed,
      createdAt: DateTime.now().millisecondsSinceEpoch,
    );
    state = [...state, c]..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    await _persist();
    return c.id;
  }

  Future<void> rename(String id, String name) async {
    state = [
      for (final c in state)
        if (c.id == id) c.copyWith(name: name.trim()) else c,
    ]..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    await _persist();
  }

  Future<void> remove(String id) async {
    state = state.where((c) => c.id != id).toList();
    await _persist();
  }
}

final collectionsProvider =
    StateNotifierProvider<CollectionsNotifier, List<Collection>>(
  (ref) => CollectionsNotifier(),
);
