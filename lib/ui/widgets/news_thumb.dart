import 'package:flutter/material.dart';

/// Lazily-loaded, memory-bounded news lead image. Renders nothing until the
/// image decodes (so it never blocks list scrolling), fades in when ready, and
/// quietly falls back to a small newspaper glyph on error or when no URL is
/// available.
///
/// `Image.network` already streams + caches via Flutter's ImageCache; we cap
/// the decode size with `cacheWidth` so a grid of thumbnails stays cheap.
class NewsThumb extends StatelessWidget {
  final String? url;
  final double width;
  final double height;
  final double radius;
  const NewsThumb({
    super.key,
    required this.url,
    this.width = 64,
    this.height = 64,
    this.radius = 8,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final iconSize = (width.isFinite ? width : 64.0) * 0.34;
    final placeholder = Container(
      color: cs.onSurface.withValues(alpha: 0.06),
      alignment: Alignment.center,
      child: Icon(Icons.image_outlined,
          size: iconSize, color: cs.onSurface.withValues(alpha: 0.25)),
    );

    Widget child;
    if (url == null || url!.isEmpty) {
      child = placeholder;
    } else {
      // Decode at roughly the displayed pixel size to keep memory low. When
      // the box is unbounded (grid tiles use width: infinity), fall back to a
      // sensible cap instead of computing an infinite cacheWidth.
      final dpr = MediaQuery.devicePixelRatioOf(context);
      final cacheW =
          width.isFinite ? (width * dpr).round() : (400 * dpr).round();
      child = Image.network(
        url!,
        width: width,
        height: height,
        fit: BoxFit.cover,
        cacheWidth: cacheW,
        gaplessPlayback: true,
        frameBuilder: (ctx, child, frame, wasSync) {
          if (wasSync || frame != null) {
            return AnimatedOpacity(
              opacity: 1,
              duration: const Duration(milliseconds: 220),
              child: child,
            );
          }
          return placeholder;
        },
        loadingBuilder: (ctx, child, progress) =>
            progress == null ? child : placeholder,
        errorBuilder: (_, __, ___) => placeholder,
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: SizedBox(width: width, height: height, child: child),
    );
  }
}
