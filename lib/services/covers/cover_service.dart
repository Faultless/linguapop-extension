import 'dart:convert';

import 'package:http/http.dart' as http;

/// One cover candidate returned from an online lookup.
class CoverCandidate {
  final String thumbnailUrl;
  final String title;
  final String? author;

  const CoverCandidate({
    required this.thumbnailUrl,
    required this.title,
    this.author,
  });
}

/// Searches for book cover art. Uses the Google Books Volumes API, which needs
/// no API key for anonymous volume search and works on every platform
/// (`package:http`), unlike the `dart:io`-based source [SessionClient].
///
/// Coverage is good for catalogued/published works and weak for Japanese web
/// novels (Syosetu &c.), which the manual cover picker covers instead.
class CoverService {
  static const _endpoint = 'https://www.googleapis.com/books/v1/volumes';

  final http.Client _client;
  CoverService([http.Client? client]) : _client = client ?? http.Client();

  Future<List<CoverCandidate>> search(
    String title, {
    String? author,
    int maxResults = 8,
  }) async {
    final t = title.trim();
    if (t.isEmpty) return const [];

    final q = StringBuffer('intitle:$t');
    if (author != null && author.trim().isNotEmpty) {
      q.write('+inauthor:${author.trim()}');
    }
    final uri = Uri.parse(_endpoint).replace(queryParameters: {
      'q': q.toString(),
      'maxResults': maxResults.clamp(1, 20).toString(),
      'printType': 'books',
    });

    try {
      final resp = await _client
          .get(uri, headers: {'Accept': 'application/json'}).timeout(
        const Duration(seconds: 12),
      );
      if (resp.statusCode != 200) return const [];
      final body = jsonDecode(utf8.decode(resp.bodyBytes));
      if (body is! Map) return const [];
      final items = body['items'];
      if (items is! List) return const [];

      final out = <CoverCandidate>[];
      for (final item in items) {
        if (item is! Map) continue;
        final info = item['volumeInfo'];
        if (info is! Map) continue;
        final links = info['imageLinks'];
        if (links is! Map) continue;
        final raw = (links['thumbnail'] ?? links['smallThumbnail']) as String?;
        if (raw == null || raw.isEmpty) continue;
        out.add(CoverCandidate(
          thumbnailUrl: _normalize(raw),
          title: (info['title'] as String?) ?? title,
          author: (info['authors'] is List && (info['authors'] as List).isNotEmpty)
              ? (info['authors'] as List).first as String?
              : null,
        ));
      }
      return out;
    } catch (_) {
      return const [];
    }
  }

  /// Best-effort single cover URL for auto-fetch on import.
  Future<String?> firstCover(String title, {String? author}) async {
    final results = await search(title, author: author, maxResults: 4);
    return results.isEmpty ? null : results.first.thumbnailUrl;
  }

  /// Google returns `http://` links with an edge-curl flag and a tiny zoom.
  /// Upgrade to https, drop the page-curl, and bump zoom for a crisper image.
  String _normalize(String url) {
    var u = url.replaceFirst('http://', 'https://');
    u = u.replaceAll('&edge=curl', '');
    u = u.replaceFirst(RegExp(r'zoom=\d'), 'zoom=2');
    return u;
  }

  void close() => _client.close();
}
