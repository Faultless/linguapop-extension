import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

const _maxChunk = 4500;
const _userAgent = 'LinguaPop/1.0 (Flutter)';

/// One-shot cancellation token. Reader passes this to long-running chapter
/// translations so the "Cancel" button can abort the in-flight chunk.
class CancelToken {
  bool _cancelled = false;
  void cancel() => _cancelled = true;
  bool get isCancelled => _cancelled;
  void throwIfCancelled() {
    if (_cancelled) throw const TranslateCancelled();
  }
}

class TranslateCancelled implements Exception {
  const TranslateCancelled();
  @override
  String toString() => 'Translation cancelled';
}

class TranslateUnavailable implements Exception {
  final String reason;
  const TranslateUnavailable(this.reason);
  @override
  String toString() => 'Translation unavailable: $reason';
}

/// Unified text translator. Tries providers in order:
///
///   1. Google Translate `gtx` public endpoint — no API key, plain JSON,
///      most accurate for our purposes. Long chunks (up to [_maxChunk])
///      are handled in one request.
///   2. MyMemory (api.mymemory.translated.net) — free public MT, used as a
///      fallback when gtx fails or rate-limits. Has a per-request word cap,
///      so chunks that fail to mymemory get re-split into smaller pieces
///      and re-tried.
///
/// LibreTranslate's two formerly-public mirrors (argosopentech.com,
/// libretranslate.de) are both dead as of 2026-05; they're intentionally not
/// in the chain anymore.
///
/// Long inputs are chunked on paragraph → sentence → hard 4500-char
/// boundaries. Chunks are translated serially so callers can show smooth
/// progress; parallel calls would risk transient rate-limits.
class TranslateService {
  http.Client? _client;
  http.Client _http() => _client ??= http.Client();

  Future<String> translateText(
    String text, {
    required String from,
    required String to,
    void Function(double progress)? onProgress,
    CancelToken? cancel,
  }) async {
    if (text.trim().isEmpty) return '';
    if (from == to) return text;

    final chunks = splitForTranslation(text);
    final out = <String>[];
    for (var i = 0; i < chunks.length; i++) {
      cancel?.throwIfCancelled();
      final translated = await _translateChunk(chunks[i], from, to);
      out.add(translated);
      onProgress?.call((i + 1) / chunks.length);
    }
    return out.join('\n\n');
  }

  Future<String> _translateChunk(String chunk, String from, String to) async {
    final errors = <String>[];

    final viaGoogle = await _googleGtxChunk(chunk, from, to, errors);
    if (viaGoogle != null) return viaGoogle;

    final viaMyMemory = await _myMemoryChunkRecursive(chunk, from, to, errors);
    if (viaMyMemory != null) return viaMyMemory;

    throw TranslateUnavailable(
      'All providers failed for this chunk (${chunk.length} chars). '
      '${errors.join(' / ')}',
    );
  }

  Future<String?> _googleGtxChunk(
      String text, String from, String to, List<String> errors) async {
    final uri = Uri.https('translate.googleapis.com', '/translate_a/single', {
      'client': 'gtx',
      'sl': from,
      'tl': to,
      'dt': 't',
      'q': text,
    });
    try {
      final res = await _http()
          .get(uri, headers: {'User-Agent': _userAgent})
          .timeout(const Duration(seconds: 20));
      if (res.statusCode != 200) {
        errors.add('gtx ${res.statusCode}');
        return null;
      }
      final decoded = jsonDecode(res.body);
      if (decoded is! List || decoded.isEmpty || decoded.first is! List) {
        errors.add('gtx parse');
        return null;
      }
      final segments = decoded.first as List;
      final buf = StringBuffer();
      for (final s in segments) {
        if (s is List && s.isNotEmpty) {
          buf.write((s.first ?? '').toString());
        }
      }
      return buf.toString();
    } on TimeoutException {
      errors.add('gtx timeout');
      return null;
    } catch (e) {
      errors.add('gtx $e');
      return null;
    }
  }

  /// MyMemory caps a single request at ~500 bytes of source text. If the input
  /// is larger we re-split it on sentence boundaries and translate each
  /// sub-chunk independently, joining the results. Note we don't recurse
  /// indefinitely — at ≤500 chars we just send it.
  static const int _myMemoryMaxBytes = 460;

  Future<String?> _myMemoryChunkRecursive(
      String text, String from, String to, List<String> errors) async {
    final utf8Bytes = utf8.encode(text).length;
    if (utf8Bytes <= _myMemoryMaxBytes) {
      return _myMemoryFlat(text, from, to, errors);
    }
    // Re-split into smaller chunks and translate each.
    final subChunks = _splitForMyMemory(text);
    final out = <String>[];
    for (final s in subChunks) {
      final translated = await _myMemoryFlat(s, from, to, errors);
      if (translated == null) return null;
      out.add(translated);
    }
    return out.join(' ');
  }

  Future<String?> _myMemoryFlat(
      String text, String from, String to, List<String> errors) async {
    final uri = Uri.https('api.mymemory.translated.net', '/get', {
      'q': text,
      'langpair': '$from|$to',
      'de': 'linguapop@local',
    });
    try {
      final res = await _http()
          .get(uri, headers: {'User-Agent': _userAgent})
          .timeout(const Duration(seconds: 20));
      if (res.statusCode != 200) {
        errors.add('mymemory ${res.statusCode}');
        return null;
      }
      final m = jsonDecode(res.body);
      if (m is! Map) {
        errors.add('mymemory parse');
        return null;
      }
      final data = m['responseData'];
      if (data is Map && data['translatedText'] is String) {
        final translated = data['translatedText'] as String;
        // MyMemory sometimes returns "QUERY LENGTH LIMIT EXCEEDED" or
        // "PLEASE SELECT TWO DISTINCT LANGUAGES" as the body. Treat any
        // status >=400 as a soft failure.
        final status = m['responseStatus'];
        if (status is num && status >= 400) {
          errors.add('mymemory status $status: $translated');
          return null;
        }
        return translated;
      }
      errors.add('mymemory missing field');
      return null;
    } on TimeoutException {
      errors.add('mymemory timeout');
      return null;
    } catch (e) {
      errors.add('mymemory $e');
      return null;
    }
  }

  /// Sentence-level splitter sized for MyMemory's per-request UTF-8 byte cap.
  /// Falls back to hard cuts if a single sentence is already too big.
  List<String> _splitForMyMemory(String text) {
    final sentences = text.split(RegExp(r'(?<=[.!?。！？])\s+'));
    final out = <String>[];
    final buf = StringBuffer();
    var bufBytes = 0;
    for (final s in sentences) {
      final sBytes = utf8.encode(s).length;
      if (sBytes > _myMemoryMaxBytes) {
        // Flush current buffer, then hard-cut the over-long sentence.
        if (buf.isNotEmpty) {
          out.add(buf.toString());
          buf.clear();
          bufBytes = 0;
        }
        var i = 0;
        while (i < s.length) {
          // Char-based step, but check byte length before adding.
          final end = (i + 200).clamp(0, s.length);
          out.add(s.substring(i, end));
          i = end;
        }
        continue;
      }
      if (bufBytes + sBytes + 1 > _myMemoryMaxBytes && buf.isNotEmpty) {
        out.add(buf.toString());
        buf.clear();
        bufBytes = 0;
      }
      if (buf.isNotEmpty) {
        buf.write(' ');
        bufBytes += 1;
      }
      buf.write(s);
      bufBytes += sBytes;
    }
    if (buf.isNotEmpty) out.add(buf.toString());
    return out;
  }

  void close() {
    _client?.close();
    _client = null;
  }
}

/// Split [text] into chunks at most [_maxChunk] characters long, preferring
/// paragraph boundaries, then sentences, then a hard cut. Visible for testing.
List<String> splitForTranslation(String text) {
  if (text.length <= _maxChunk) return [text];

  final paragraphs = text.split(RegExp(r'\n{2,}'));
  final chunks = <String>[];
  var buf = StringBuffer();

  void flush() {
    if (buf.isNotEmpty) {
      chunks.add(buf.toString());
      buf = StringBuffer();
    }
  }

  void append(String s, String sep) {
    if (buf.isEmpty) {
      buf.write(s);
    } else {
      buf.write(sep);
      buf.write(s);
    }
  }

  for (final p in paragraphs) {
    final wouldBe = buf.length + (buf.isEmpty ? 0 : 2) + p.length;
    if (wouldBe <= _maxChunk) {
      append(p, '\n\n');
      continue;
    }
    flush();
    if (p.length <= _maxChunk) {
      buf.write(p);
      continue;
    }
    // Paragraph too long — sentence split.
    final sentences = p.split(RegExp(r'(?<=[.!?。！？])\s+'));
    for (final s in sentences) {
      final wouldBeS = buf.length + (buf.isEmpty ? 0 : 1) + s.length;
      if (wouldBeS <= _maxChunk) {
        append(s, ' ');
        continue;
      }
      flush();
      if (s.length <= _maxChunk) {
        buf.write(s);
      } else {
        // Hard cut.
        for (var i = 0; i < s.length; i += _maxChunk) {
          final end = (i + _maxChunk).clamp(0, s.length);
          chunks.add(s.substring(i, end));
        }
      }
    }
  }
  flush();
  return chunks;
}
