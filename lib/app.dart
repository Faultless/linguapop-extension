import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/jlpt_provider.dart';
import 'providers/prefs_provider.dart';
import 'providers/tokenizer_provider.dart';
import 'ui/router.dart';

class LinguapopApp extends ConsumerStatefulWidget {
  const LinguapopApp({super.key});

  @override
  ConsumerState<LinguapopApp> createState() => _LinguapopAppState();
}

class _LinguapopAppState extends ConsumerState<LinguapopApp> {
  @override
  void initState() {
    super.initState();
    // Fire-and-forget warm-ups: the first IPADIC copy to disk is ~51 MB and
    // takes a few seconds, so kick it off before the user opens a chapter.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(tokenizerStatusProvider.future);
      ref.read(jlptLoadedProvider.future);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(activeThemeProvider);
    return MaterialApp.router(
      title: 'LinguaPop',
      debugShowCheckedModeBanner: false,
      theme: theme.toThemeData(),
      routerConfig: appRouter,
    );
  }
}
