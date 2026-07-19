// Standalone smoke test for the source adapters.
//
// Run with:
//   dart run tool/smoke_sources.dart
//
// Exercises both adapters against the real upstream APIs. Useful when an
// upstream changes its HTML / JSON shape — the build itself can't catch
// that. Not part of `flutter test` because it hits the network.

import 'package:linguapop/services/sources/nhk_easy.dart';
import 'package:linguapop/services/sources/session_client.dart';
import 'package:linguapop/services/sources/source_types.dart';
import 'package:linguapop/services/sources/syosetu.dart';

Future<void> main() async {
  final client = SessionClient();

  print('--- Syosetu search ---');
  try {
    final syosetu = SyosetuSource(client);
    final results = await syosetu.search(const SearchQuery(
      word: '異世界',
      order: SearchOrder.rating,
      limit: 3,
    ));
    print('  ${results.length} results');
    for (final b in results) {
      print('  • ${b.title}  by ${b.author ?? "?"}  '
          '(${b.chapterCount ?? "?"} ch, isSerial=${b.extra['isSerial']})');
    }
    if (results.isNotEmpty) {
      print('  → listing chapters for first result…');
      final stubs = await syosetu.listChapters(results.first);
      print('  ${stubs.length} chapter stubs');
      if (stubs.isNotEmpty) {
        final ch = await syosetu.fetchChapter(results.first, stubs.first);
        print('  • first chapter title: "${ch.title}"');
        print('  • body length: ${ch.originalText.length} chars');
        final preview = ch.originalText.replaceAll('\n', ' ⏎ ');
        print('  • preview: ${preview.substring(0, preview.length.clamp(0, 80))}…');
      }
    }
  } catch (e, st) {
    print('  ✗ Syosetu failed: $e');
    print(st);
  }

  print('');
  print('--- NHK Easy list + first article ---');
  try {
    final nhk = NhkEasySource(client);
    final articles = await nhk.list();
    print('  ${articles.length} articles');
    for (final a in articles.take(3)) {
      print('  • ${a.title}');
    }
    if (articles.isNotEmpty) {
      final ch = await nhk.fetch(articles.first);
      print('  → fetched: "${ch.title}"  (${ch.originalText.length} chars)');
      final preview = ch.originalText.replaceAll('\n', ' ⏎ ');
      print('  • preview: ${preview.substring(0, preview.length.clamp(0, 80))}…');
    }
  } catch (e, st) {
    print('  ✗ NHK Easy failed: $e');
    print(st);
  }

  client.close();
}
