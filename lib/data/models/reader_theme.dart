import 'package:flutter/material.dart';

class ReaderTheme {
  final String id;
  final String name;
  final Color bg;
  final Color fg;
  final Color accent;
  final Color muted;
  final bool dark;
  final bool custom;

  const ReaderTheme({
    required this.id,
    required this.name,
    required this.bg,
    required this.fg,
    required this.accent,
    required this.muted,
    required this.dark,
    this.custom = false,
  });

  /// Build a Material 3 ThemeData seeded from this reader theme.
  ThemeData toThemeData() {
    final scheme = ColorScheme.fromSeed(
      seedColor: accent,
      brightness: dark ? Brightness.dark : Brightness.light,
      surface: bg,
      onSurface: fg,
      primary: accent,
      onPrimary: dark ? Colors.black : Colors.white,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: bg,
      canvasColor: bg,
      brightness: dark ? Brightness.dark : Brightness.light,
      textTheme: Typography.material2021(
        platform: TargetPlatform.android,
        colorScheme: scheme,
      ).black.apply(
            bodyColor: fg,
            displayColor: fg,
            decorationColor: fg,
          ),
      iconTheme: IconThemeData(color: fg),
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        foregroundColor: fg,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: bg,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
      ),
      dividerTheme: DividerThemeData(color: muted.withValues(alpha: 0.25)),
      dialogTheme: DialogThemeData(
        backgroundColor: bg,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: dark
            ? Color.lerp(bg, Colors.white, 0.06)
            : Color.lerp(bg, Colors.black, 0.04),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      listTileTheme: ListTileThemeData(
        iconColor: fg,
        textColor: fg,
      ),
    );
  }

  static String _hex(Color c) {
    final v = c.toARGB32();
    return '#${(v & 0xFFFFFF).toRadixString(16).padLeft(6, '0')}';
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'bg': _hex(bg),
        'fg': _hex(fg),
        'accent': _hex(accent),
        'muted': _hex(muted),
        'dark': dark,
        if (custom) 'custom': true,
      };

  factory ReaderTheme.fromJson(Map<String, dynamic> j) => ReaderTheme(
        id: j['id'] as String,
        name: j['name'] as String,
        bg: _parseHex(j['bg'] as String),
        fg: _parseHex(j['fg'] as String),
        accent: _parseHex(j['accent'] as String),
        muted: _parseHex(j['muted'] as String),
        dark: j['dark'] as bool? ?? false,
        custom: j['custom'] as bool? ?? false,
      );

  static Color _parseHex(String s) {
    var hex = s.replaceFirst('#', '').trim();
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }
}
