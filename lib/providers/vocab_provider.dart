import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/vocab_entry.dart';
import '../data/storage/storage.dart';

const _vocabKey = 'list';

class VocabNotifier extends StateNotifier<List<VocabEntry>> {
  VocabNotifier() : super(_load());

  /// Read-only view of the current vocab list, safe to call from outside the
  /// notifier (e.g. from the exporter).
  List<VocabEntry> get all => state;

  static List<VocabEntry> _load() {
    try {
      final raw = Storage.vocab().get(_vocabKey);
      if (raw is String && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          return decoded
              .map((j) =>
                  VocabEntry.fromJson(Map<String, dynamic>.from(j as Map)))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<void> _persist() async {
    await Storage.vocab()
        .put(_vocabKey, jsonEncode(state.map((v) => v.toJson()).toList()));
  }

  Future<void> upsert(VocabEntry entry) async {
    final idx = state.indexWhere(
        (e) => e.base == entry.base && e.isPhrase == entry.isPhrase);
    if (idx >= 0) {
      state = [
        for (var i = 0; i < state.length; i++) i == idx ? entry : state[i],
      ];
    } else {
      state = [entry, ...state];
    }
    await _persist();
  }

  Future<void> remove(String id) async {
    state = state.where((e) => e.id != id).toList();
    await _persist();
  }
}

final vocabProvider =
    StateNotifierProvider<VocabNotifier, List<VocabEntry>>(
  (ref) => VocabNotifier(),
);
