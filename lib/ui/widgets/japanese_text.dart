import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/jp_token.dart';
import '../../data/models/reader_prefs.dart';
import '../../data/themes/builtin_themes.dart';
import '../../providers/jlpt_provider.dart';
import '../../providers/tokenizer_provider.dart';
import '../../services/dictionary/jlpt_lookup.dart';
import '../../services/tokenizer/jp_tokenizer.dart';

/// Renders Japanese prose with per-token JLPT color coding. Each content-word
/// token is rendered as a tappable [TextSpan] with an underline in its level
/// color. Tokens with no JLPT match render plain. While the tokenizer is still
/// loading, the text falls back to a plain single-span render of the input.
class JapaneseText extends ConsumerStatefulWidget {
  final String text;
  final ReaderPrefs prefs;
  final TextStyle? baseStyle;
  final void Function(JpToken token)? onTapToken;

  const JapaneseText({
    super.key,
    required this.text,
    required this.prefs,
    this.baseStyle,
    this.onTapToken,
  });

  @override
  ConsumerState<JapaneseText> createState() => _JapaneseTextState();
}

class _JapaneseTextState extends ConsumerState<JapaneseText> {
  List<JpToken>? _tokens;
  TokenizerStatus _lastStatus = TokenizerStatus.idle;
  final List<TapGestureRecognizer> _recognizers = [];

  @override
  void didUpdateWidget(covariant JapaneseText old) {
    super.didUpdateWidget(old);
    if (old.text != widget.text) _tokens = null;
  }

  @override
  void dispose() {
    for (final r in _recognizers) {
      r.dispose();
    }
    super.dispose();
  }

  void _retokenize() {
    final t = ref.read(tokenizerProvider);
    final cache = ref.read(jpTokenCacheProvider);
    final cached = cache.get(widget.text);
    if (cached != null && t.status == TokenizerStatus.ready) {
      _tokens = cached;
    } else {
      _tokens = t.tokenize(widget.text);
      if (t.status == TokenizerStatus.ready) {
        cache.put(widget.text, _tokens!);
      }
    }
    _lastStatus = t.status;
  }

  @override
  Widget build(BuildContext context) {
    // Drive rebuilds when the tokenizer finishes loading or the JLPT map grows.
    final tokenizerStatusAsync = ref.watch(tokenizerStatusProvider);
    ref.watch(jlptLoadedProvider);

    final tokenizer = ref.watch(tokenizerProvider);
    final jlpt = ref.watch(jlptLookupProvider);

    final ready = tokenizer.status == TokenizerStatus.ready;

    if (!ready) {
      // While we wait for the tokenizer, render text plainly so the reader
      // remains immediately responsive — JLPT coloring fills in once ready.
      return Text(widget.text, style: widget.baseStyle);
    }

    if (_tokens == null || _lastStatus != tokenizer.status) {
      _retokenize();
    }

    final spans = _buildSpans(_tokens!, widget.prefs, jlpt);
    // Touch the async value to avoid unused_local_variable lint while keeping
    // a clean dependency on the provider's loading state.
    assert(tokenizerStatusAsync.isLoading || tokenizerStatusAsync.hasValue);

    // Use Text.rich (not RichText) so we participate in the ambient
    // SelectionArea — long-press triggers native text selection handles,
    // selection spans across paragraphs, and the per-token TapGestureRecognizer
    // keeps working for short taps.
    return Text.rich(
      TextSpan(style: widget.baseStyle, children: spans),
    );
  }

  List<InlineSpan> _buildSpans(
      List<JpToken> tokens, ReaderPrefs prefs, JlptLookup jlpt) {
    // Drop stale recognizers and rebuild a parallel list.
    for (final r in _recognizers) {
      r.dispose();
    }
    _recognizers.clear();

    final spans = <InlineSpan>[];
    for (final tk in tokens) {
      final color = _colorFor(tk, prefs, jlpt);
      if (color == null) {
        spans.add(TextSpan(text: tk.surface));
      } else {
        final recognizer = TapGestureRecognizer()
          ..onTap = widget.onTapToken == null
              ? null
              : () => widget.onTapToken!(tk);
        _recognizers.add(recognizer);
        spans.add(TextSpan(
          text: tk.surface,
          recognizer: recognizer,
          style: TextStyle(
            color: color,
            decoration: TextDecoration.underline,
            decorationStyle: TextDecorationStyle.dotted,
            decorationColor: color,
            decorationThickness: 1.5,
          ),
        ));
      }
    }
    return spans;
  }

  Color? _colorFor(JpToken tk, ReaderPrefs prefs, JlptLookup jlpt) {
    if (!prefs.coloriseJapanese) return null;
    if (tk.isFiller) return null;
    final hit = jlpt.lookup(
        base: tk.base, surface: tk.surface, reading: tk.reading);
    if (hit == null) return null;
    if (!prefs.jlptColorRules.isHighlighted(tk.posCategory, hit.level)) {
      return null;
    }
    return kJlptColors[hit.level];
  }
}
