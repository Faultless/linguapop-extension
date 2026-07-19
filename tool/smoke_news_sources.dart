// Smoke test for the news feed adapters (NHK Easy, NHK News, Mainichi).
//
//   dart run tool/smoke_news_sources.dart
//
// Hits the live upstreams: lists each feed and fetches the first article.

import 'package:linguapop/services/sources/mainichi.dart';
import 'package:linguapop/services/sources/nhk_easy.dart';
import 'package:linguapop/services/sources/nhk_news.dart';
import 'package:linguapop/services/sources/session_client.dart';
import 'package:linguapop/services/sources/source_types.dart';

Future<void> main() async {
  final client = SessionClient();
  final sources = <FeedSource>[
    NhkEasySource(client),
    NhkNewsSource(client),
    MainichiSource(client),
  ];

  var failures = 0;
  for (final s in sources) {
    print('--- ${s.name} (${s.id}) ---');
    try {
      final items = await s.list();
      print('  ${items.length} articles');
      for (final a in items.take(3)) {
        print('  • ${a.title}'
            '${a.publishedAt != null ? "  [${DateTime.fromMillisecondsSinceEpoch(a.publishedAt!)}]" : ""}');
      }
      if (items.isEmpty) {
        failures++;
        print('  ✗ empty list');
        continue;
      }
      final ch = await s.fetch(items.first);
      print('  → fetched "${ch.title}" (${ch.originalText.length} chars, '
          '${ch.originalText.split('\n\n').length} paragraphs)');
      final preview = ch.originalText.replaceAll('\n', ' ⏎ ');
      print('  → ${preview.substring(0, preview.length.clamp(0, 120))}…');
      if (ch.originalText.length < 100) {
        failures++;
        print('  ✗ suspiciously short body');
      }
    } catch (e) {
      failures++;
      print('  ✗ failed: $e');
    }
    print('');
  }
  client.close();
  if (failures > 0) {
    print('$failures failure(s)');
  } else {
    print('All news sources OK');
  }
}
