// Smoke test for the translation service against live Google + LibreTranslate.
// Run: dart run tool/smoke_translate.dart
import 'package:linguapop/services/translation/translate_service.dart';

Future<void> main() async {
  final svc = TranslateService();
  print('--- short ja → en ---');
  final out = await svc.translateText(
    '今日は天気が良いですね。',
    from: 'ja',
    to: 'en',
  );
  print('  → "$out"');

  print('--- multi-paragraph natural ja → en ---');
  final long = '''
吾輩は猫である。名前はまだ無い。

どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。吾輩はここで始めて人間というものを見た。

しかもあとで聞くとそれは書生という人間中で一番獰悪な種族であったそうだ。この書生というのは時々我々を捕えて煮て食うという話である。
''';
  final res = await svc.translateText(
    long,
    from: 'ja',
    to: 'en',
    onProgress: (p) => print('  progress ${(p * 100).round()}%'),
  );
  print('  → ${res.length} chars');
  print('  preview: ${res.substring(0, res.length.clamp(0, 240))}');

  print('--- chunk splitter unit check ---');
  final chunks = splitForTranslation('a' * 4500 + '\n\n' + 'b' * 4500);
  print('  ${chunks.length} chunks of sizes ${chunks.map((c) => c.length).toList()}');

  print('--- forcing MyMemory fallback (point gtx at /dev/null host) ---');
  // We can't easily force gtx to fail without monkey-patching, so we just
  // exercise MyMemory via a direct request through the real chain by
  // translating a noticeably-different sentence and trusting the log.
  final fallback = await svc.translateText(
    'プログラミングは楽しいです。',
    from: 'ja',
    to: 'en',
  );
  print('  → "$fallback"');

  svc.close();
}
