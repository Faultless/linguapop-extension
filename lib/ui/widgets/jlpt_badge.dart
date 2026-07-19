import 'package:flutter/material.dart';
import '../../data/themes/builtin_themes.dart';

class JlptBadge extends StatelessWidget {
  final int level; // 1..5 (1 = N1 hardest, 5 = N5 easiest)
  final double size;
  const JlptBadge({super.key, required this.level, this.size = 11});

  @override
  Widget build(BuildContext context) {
    final c = kJlptColors[level] ?? Colors.grey;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: size * 0.55, vertical: size * 0.15),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.16),
        border: Border.all(color: c.withValues(alpha: 0.7), width: 1),
        borderRadius: BorderRadius.circular(size * 0.6),
      ),
      child: Text(
        'N$level',
        style: TextStyle(
          fontSize: size,
          fontWeight: FontWeight.w700,
          color: c,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
