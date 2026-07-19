import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/storage/storage.dart';

/// `coverUrl` values that start with this scheme point at locally-stored image
/// bytes in the `covers` Hive box (e.g. a photo the user picked from device),
/// rather than a remote/`data:` URL. We keep the bytes out of the novel meta
/// list so that list stays small and loads fast on startup.
const kLocalCoverScheme = 'local:';

bool isLocalCover(String? url) => url != null && url.startsWith(kLocalCoverScheme);

class LocalCoverStore {
  static Uint8List? get(String novelId) {
    final raw = Storage.covers().get(novelId);
    if (raw is String && raw.isNotEmpty) {
      try {
        return base64Decode(raw);
      } catch (_) {}
    }
    return null;
  }

  static Future<void> put(String novelId, Uint8List bytes) async {
    await Storage.covers().put(novelId, base64Encode(bytes));
  }

  static Future<void> delete(String novelId) async {
    await Storage.covers().delete(novelId);
  }
}

/// Bumped whenever a local cover's bytes change. `BookCover` watches it so a
/// freshly-picked cover repaints immediately even though the bytes live outside
/// Riverpod state.
final coverRevisionProvider = StateProvider<int>((_) => 0);
