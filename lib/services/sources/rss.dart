import 'package:html/dom.dart' as dom;
import 'package:xml/xml.dart';

/// One entry of a syndication feed, normalized across RSS 2.0 and RDF/RSS 1.0.
class RssItem {
  final String title;
  final String link;
  final String? description;
  final int? publishedAt; // ms-since-epoch

  const RssItem({
    required this.title,
    required this.link,
    this.description,
    this.publishedAt,
  });
}

/// Minimal feed parser covering the two dialects our news sources use:
///   * RSS 2.0  (`<rss><channel><item>…`)  — NHK
///   * RDF/RSS 1.0 (`<rdf:RDF><item>…`)    — Mainichi
List<RssItem> parseRssItems(String xmlText) {
  final doc = XmlDocument.parse(xmlText);
  final out = <RssItem>[];
  for (final item in doc.findAllElements('item')) {
    final title = _text(item, 'title');
    final link = _text(item, 'link');
    if (title == null || link == null) continue;
    out.add(RssItem(
      title: title.replaceAll(RegExp(r'\s+'), ' ').trim(),
      link: link.trim(),
      description: _text(item, 'description'),
      publishedAt: _parseDate(_text(item, 'pubDate') ?? _text(item, 'date')),
    ));
  }
  return out;
}

/// Pull the social-card lead image (`og:image`, falling back to
/// `twitter:image`) out of a parsed article document. Used by the news
/// adapters whose feeds don't carry images but whose article pages do.
String? ogImage(dom.Document doc) {
  for (final sel in [
    'meta[property="og:image"]',
    'meta[name="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="twitter:image"]',
  ]) {
    final v = doc.querySelector(sel)?.attributes['content'];
    if (v != null && v.trim().isNotEmpty) return v.trim();
  }
  return null;
}

String? _text(XmlElement parent, String localName) {
  for (final el in parent.childElements) {
    if (el.name.local == localName) {
      final t = el.innerText.trim();
      return t.isEmpty ? null : t;
    }
  }
  return null;
}

int? _parseDate(String? s) {
  if (s == null) return null;
  // ISO 8601 (dc:date) parses directly.
  final iso = DateTime.tryParse(s);
  if (iso != null) return iso.millisecondsSinceEpoch;
  return _parseRfc822(s);
}

const _months = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
};

/// "Sat, 13 Jun 2026 00:19:26 +0900" → ms-since-epoch. Returns null on
/// anything it doesn't understand.
int? _parseRfc822(String s) {
  final m = RegExp(
          r'(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s*([+-]\d{4}|GMT|UTC)?')
      .firstMatch(s);
  if (m == null) return null;
  final month = _months[m.group(2)];
  if (month == null) return null;
  var dt = DateTime.utc(
    int.parse(m.group(3)!),
    month,
    int.parse(m.group(1)!),
    int.parse(m.group(4)!),
    int.parse(m.group(5)!),
    int.parse(m.group(6) ?? '0'),
  );
  final tz = m.group(7);
  if (tz != null && tz.length == 5) {
    final sign = tz.startsWith('-') ? -1 : 1;
    final offset = Duration(
      hours: int.parse(tz.substring(1, 3)),
      minutes: int.parse(tz.substring(3, 5)),
    );
    dt = dt.subtract(offset * sign);
  }
  return dt.millisecondsSinceEpoch;
}
