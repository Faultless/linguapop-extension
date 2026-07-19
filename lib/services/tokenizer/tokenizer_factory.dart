import 'jp_tokenizer.dart';

// Conditional import: native impl on platforms with dart:io, web stub elsewhere.
import 'mecab_tokenizer_native.dart'
    if (dart.library.html) 'mecab_tokenizer_stub.dart' as impl;

/// Returns a tokenizer implementation appropriate for the current platform.
JpTokenizer createJpTokenizer() => impl.createTokenizer();
