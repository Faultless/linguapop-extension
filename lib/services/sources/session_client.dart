import 'dart:async';
import 'dart:convert';
import 'dart:io' as io;

const _defaultUserAgent =
    'Mozilla/5.0 (Linux; Android) LinguaPop/1.0 (jp-reader)';
const _maxRedirects = 10;

/// Cookie-aware HTTP client used by source adapters. Wraps `dart:io HttpClient`
/// directly so we can drive redirects manually — that's what NHK Easy's
/// `/tix/build_authorize` flow needs (multiple 302 hops, each setting cookies
/// that are required by the next hop). `HttpClient`'s built-in
/// `followRedirects` drops cookies between hops, so we follow ourselves.
///
/// Not suitable for Flutter web — `dart:io` is unavailable there. Source
/// adapters opt into this client; on web, source browsing is disabled.
class SessionClient {
  final io.HttpClient _http = io.HttpClient()
    ..userAgent = _defaultUserAgent
    ..connectionTimeout = const Duration(seconds: 15)
    ..idleTimeout = const Duration(seconds: 30);

  /// Cookies bucketed by exact host (we don't try to enforce the full RFC 6265
  /// scoping rules — sites we hit use one or two domains and parent-domain
  /// cookies are sent to subdomains via the [_hostMatches] check below).
  final Map<String, Map<String, io.Cookie>> _jar = {};

  /// Diagnostic: returns a flat dump of all cookies currently in the jar.
  Map<String, String> dumpCookies() {
    final out = <String, String>{};
    for (final e in _jar.entries) {
      for (final c in e.value.values) {
        out['${e.key}:${c.name}'] = c.value;
      }
    }
    return out;
  }

  Future<HttpResult> get(Uri url, {Map<String, String>? headers}) async =>
      _request('GET', url, headers: headers);

  Future<HttpResult> _request(String method, Uri url,
      {Map<String, String>? headers}) async {
    var current = url;
    var hops = 0;
    while (true) {
      hops++;
      final req = await _http.openUrl(method, current);
      req.followRedirects = false;
      headers?.forEach(req.headers.set);
      _attachCookies(current, req);
      final res = await req.close();
      _captureCookies(current, res.cookies);

      if (res.isRedirect && hops < _maxRedirects) {
        await res.drain<void>();
        final loc = res.headers.value('location');
        if (loc == null) break;
        current = current.resolve(loc);
        continue;
      }

      final bodyBytes = <int>[];
      await for (final chunk in res) {
        bodyBytes.addAll(chunk);
      }
      return HttpResult(
        statusCode: res.statusCode,
        body: _decodeBody(bodyBytes, res.headers.contentType?.charset),
        bytes: bodyBytes,
        contentType: res.headers.contentType?.mimeType ?? '',
      );
    }
    throw Exception('Too many redirects (>$_maxRedirects) starting at $url');
  }

  /// Returns true when [requestHost] should receive a cookie that was set
  /// on [cookieHost]. RFC 6265 §5.1.3 domain-match: a request host matches a
  /// cookie domain if it's exactly that domain or a subdomain of it.
  ///
  /// We don't distinguish "host-only" cookies (no Domain attribute) from
  /// domain cookies — `dart:io` strips the leading dot from the parsed
  /// `Cookie.domain` and doesn't expose the original attribute, so we treat
  /// every captured cookie as a domain cookie. In practice this just means a
  /// cookie set on `web.nhk` is also sent to `news.web.nhk`, which is what
  /// the NHK auth flow relies on.
  bool _hostMatches(String requestHost, String cookieHost) {
    final bare =
        cookieHost.startsWith('.') ? cookieHost.substring(1) : cookieHost;
    return requestHost == bare || requestHost.endsWith('.$bare');
  }

  void _attachCookies(Uri url, io.HttpClientRequest req) {
    final host = url.host;
    for (final entry in _jar.entries) {
      if (_hostMatches(host, entry.key)) {
        for (final c in entry.value.values) {
          req.cookies.add(c);
        }
      }
    }
  }

  void _captureCookies(Uri url, List<io.Cookie> cookies) {
    if (cookies.isEmpty) return;
    for (final c in cookies) {
      final host =
          c.domain != null && c.domain!.isNotEmpty ? c.domain! : url.host;
      final bucket = _jar.putIfAbsent(host, () => {});
      bucket[c.name] = c;
    }
  }

  String _decodeBody(List<int> bytes, String? charset) {
    if (charset == null || charset.toLowerCase() == 'utf-8') {
      return utf8.decode(bytes, allowMalformed: true);
    }
    return latin1.decode(bytes, allowInvalid: true);
  }

  void close() => _http.close(force: true);
}

class HttpResult {
  final int statusCode;
  final String body;
  final List<int> bytes;
  final String contentType;
  const HttpResult({
    required this.statusCode,
    required this.body,
    required this.bytes,
    required this.contentType,
  });

  bool get ok => statusCode >= 200 && statusCode < 300;
}
