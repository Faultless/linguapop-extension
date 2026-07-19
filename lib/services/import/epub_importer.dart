import 'dart:convert';
import 'dart:typed_data';

import 'package:archive/archive.dart';
import 'package:uuid/uuid.dart';
import 'package:xml/xml.dart';

import '../../data/models/chapter.dart';

const _uuid = Uuid();
const _dcNamespace = 'http://purl.org/dc/elements/1.1/';

class ParsedEpub {
  final String title;
  final String? author;
  final String? language;
  final String? coverDataUrl;
  final List<Chapter> chapters;

  const ParsedEpub({
    required this.title,
    this.author,
    this.language,
    this.coverDataUrl,
    required this.chapters,
  });
}

/// Parse an EPUB 2/3 file into a structured novel. Walks the OPF spine and
/// extracts visible text from each XHTML chapter. Items with fewer than 80
/// chars of body text are dropped (covers, colophons).
ParsedEpub parseEpub(Uint8List bytes) {
  final archive = ZipDecoder().decodeBytes(bytes);
  final byPath = <String, ArchiveFile>{
    for (final f in archive.files)
      if (f.isFile) f.name: f,
  };

  // 1. Locate the OPF rootfile via META-INF/container.xml.
  final containerFile = byPath['META-INF/container.xml'];
  if (containerFile == null) {
    throw const FormatException(
        'Not a valid EPUB: missing META-INF/container.xml');
  }
  final containerXml = utf8.decode(containerFile.content as List<int>);
  final opfPath = RegExp(r'full-path="([^"]+)"')
      .firstMatch(containerXml)
      ?.group(1);
  if (opfPath == null) {
    throw const FormatException('EPUB container.xml has no rootfile');
  }
  final opfFile = byPath[opfPath];
  if (opfFile == null) {
    throw FormatException('EPUB: OPF not found at $opfPath');
  }
  final opfXml = utf8.decode(opfFile.content as List<int>);
  final opfDir = opfPath.contains('/')
      ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1)
      : '';

  final opfDoc = XmlDocument.parse(opfXml);

  // 2. Metadata.
  final title = _metaText(opfDoc, 'title') ?? 'Untitled';
  final author = _metaText(opfDoc, 'creator');
  final language = _metaText(opfDoc, 'language');

  // 3. Manifest: id → {href, mediaType, properties}.
  final manifest = <String, _ManifestItem>{};
  for (final item in opfDoc.findAllElements('item')) {
    if (item.parentElement?.name.local != 'manifest') continue;
    final id = item.getAttribute('id');
    final href = item.getAttribute('href');
    if (id == null || href == null) continue;
    manifest[id] = _ManifestItem(
      href: href,
      mediaType: item.getAttribute('media-type') ?? '',
      properties: item.getAttribute('properties') ?? '',
    );
  }

  // 4. Cover image (best-effort).
  String? coverDataUrl;
  final coverIdMeta = opfDoc
      .findAllElements('meta')
      .where((el) => el.getAttribute('name') == 'cover')
      .map((el) => el.getAttribute('content'))
      .firstOrNull;
  final coverIdProp = manifest.entries
      .firstWhereOrNull((e) => e.value.properties.contains('cover-image'))
      ?.key;
  final coverId = coverIdMeta ?? coverIdProp;
  if (coverId != null) {
    final cover = manifest[coverId];
    if (cover != null) {
      final coverFile = byPath[opfDir + cover.href];
      if (coverFile != null) {
        final b64 = base64Encode(coverFile.content as List<int>);
        final mime = cover.mediaType.isEmpty ? 'image/jpeg' : cover.mediaType;
        coverDataUrl = 'data:$mime;base64,$b64';
      }
    }
  }

  // 5. Spine order.
  final spineIds = <String>[];
  for (final ref in opfDoc.findAllElements('itemref')) {
    final idref = ref.getAttribute('idref');
    if (idref != null) spineIds.add(idref);
  }

  // 6. Walk each spine entry and extract text.
  final chapters = <Chapter>[];
  for (final id in spineIds) {
    final item = manifest[id];
    if (item == null) continue;
    if (!RegExp(r'xhtml|html', caseSensitive: false)
            .hasMatch(item.mediaType) &&
        !RegExp(r'\.x?html?$', caseSensitive: false).hasMatch(item.href)) {
      continue;
    }
    final f = byPath[opfDir + item.href];
    if (f == null) continue;
    final raw = utf8.decode(f.content as List<int>, allowMalformed: true);
    final extracted = _extractXhtmlText(raw);
    if (extracted.text.replaceAll(RegExp(r'\s+'), ' ').trim().length < 80) {
      continue;
    }
    chapters.add(Chapter(
      id: _uuid.v4(),
      title: extracted.title.isNotEmpty
          ? extracted.title
          : 'Chapter ${chapters.length + 1}',
      originalText: extracted.text,
    ));
  }

  return ParsedEpub(
    title: title,
    author: author,
    language: language,
    coverDataUrl: coverDataUrl,
    chapters: chapters,
  );
}

class _ManifestItem {
  final String href;
  final String mediaType;
  final String properties;
  const _ManifestItem(
      {required this.href, required this.mediaType, required this.properties});
}

class _Extracted {
  final String title;
  final String text;
  const _Extracted({required this.title, required this.text});
}

String? _metaText(XmlDocument doc, String localName) {
  for (final el in doc.findAllElements(localName, namespace: _dcNamespace)) {
    final text = el.innerText.trim();
    if (text.isNotEmpty) return text;
  }
  for (final el in doc.findAllElements('dc:$localName')) {
    final text = el.innerText.trim();
    if (text.isNotEmpty) return text;
  }
  return null;
}

/// Extract a chapter title + text body from an XHTML chapter. EPUB XHTML is
/// usually well-formed XML, but it's full of markup we don't want — block
/// elements get `\n\n` inserted between them, `<br>` becomes `\n`, scripts /
/// styles are stripped before parsing.
_Extracted _extractXhtmlText(String html) {
  final cleaned = html
      .replaceAll(RegExp(r'<\?xml[\s\S]*?\?>'), '')
      .replaceAll(RegExp(r'<!DOCTYPE[\s\S]*?>'), '')
      .replaceAll(
          RegExp(r'<script[\s\S]*?</script>', caseSensitive: false), '')
      .replaceAll(
          RegExp(r'<style[\s\S]*?</style>', caseSensitive: false), '');

  XmlDocument? doc;
  try {
    doc = XmlDocument.parse(cleaned);
  } catch (_) {
    // Fall back to a regex strip if XML parsing fails (malformed XHTML).
    final raw = cleaned
        .replaceAll(RegExp(r'<br[^>]*>', caseSensitive: false), '\n')
        .replaceAll(
            RegExp(
                r'</(?:p|div|li|h[1-6]|blockquote|pre|tr)>',
                caseSensitive: false),
            '\n\n')
        .replaceAll(RegExp(r'<[^>]+>'), '')
        .replaceAll('&nbsp;', ' ');
    return _Extracted(
      title: '',
      text: _decodeEntities(raw)
          .replaceAll(RegExp(r'[ \t]+\n'), '\n')
          .replaceAll(RegExp(r'\n{3,}'), '\n\n')
          .trim(),
    );
  }

  // Find the chapter title from the first heading or <title>.
  String title = '';
  for (final tag in ['h1', 'h2', 'h3', 'title']) {
    final el = doc.findAllElements(tag).firstOrNull;
    if (el != null && el.innerText.trim().isNotEmpty) {
      title = el.innerText.trim();
      if (title.length > 120) title = title.substring(0, 120);
      break;
    }
  }

  // Walk the body, joining block elements with double newlines and <br> with single newlines.
  final body = doc.findAllElements('body').firstOrNull ?? doc.rootElement;
  final buf = StringBuffer();
  _walk(body, buf);

  final text = _decodeEntities(buf.toString())
      .replaceAll(RegExp(r' '), ' ')
      .replaceAll(RegExp(r'[ \t]+\n'), '\n')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .trim();

  return _Extracted(title: title, text: text);
}

const _blockTags = {
  'p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'tr', 'section', 'article', 'header', 'footer',
};

void _walk(XmlNode node, StringBuffer buf) {
  for (final child in node.children) {
    if (child is XmlText) {
      buf.write(child.value);
    } else if (child is XmlElement) {
      final name = child.name.local.toLowerCase();
      if (name == 'br') {
        buf.write('\n');
        continue;
      }
      if (name == 'script' || name == 'style') continue;
      _walk(child, buf);
      if (_blockTags.contains(name)) buf.write('\n\n');
    }
  }
}

String _decodeEntities(String s) {
  return s
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&apos;', "'")
      .replaceAll('&#x27;', "'")
      .replaceAll('&#39;', "'");
}

// Tiny iterable helpers to keep callsites readable.
extension _Iter<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
  T? firstWhereOrNull(bool Function(T) test) {
    for (final e in this) {
      if (test(e)) return e;
    }
    return null;
  }
}
