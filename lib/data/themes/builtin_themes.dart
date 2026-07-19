import 'package:flutter/material.dart';
import '../models/reader_theme.dart';

const String kDefaultThemeId = 'paper';

final List<ReaderTheme> kBuiltinThemes = [
  const ReaderTheme(
      id: 'paper',
      name: 'Paper',
      bg: Color(0xFFFAFAF6),
      fg: Color(0xFF1C1917),
      accent: Color(0xFFB45309),
      muted: Color(0xFF78716C),
      dark: false),
  const ReaderTheme(
      id: 'sepia',
      name: 'Sepia',
      bg: Color(0xFFF1E3C8),
      fg: Color(0xFF3B2A14),
      accent: Color(0xFFA16207),
      muted: Color(0xFF7C5E3A),
      dark: false),
  const ReaderTheme(
      id: 'cream',
      name: 'Cream',
      bg: Color(0xFFFFF8E7),
      fg: Color(0xFF2B1F0C),
      accent: Color(0xFFD97706),
      muted: Color(0xFF92744D),
      dark: false),
  const ReaderTheme(
      id: 'rose',
      name: 'Rose',
      bg: Color(0xFFFFF1F2),
      fg: Color(0xFF3F0A17),
      accent: Color(0xFFBE123C),
      muted: Color(0xFF8B3A4A),
      dark: false),
  const ReaderTheme(
      id: 'mint',
      name: 'Mint',
      bg: Color(0xFFECFDF5),
      fg: Color(0xFF022C22),
      accent: Color(0xFF047857),
      muted: Color(0xFF3F6B5F),
      dark: false),
  const ReaderTheme(
      id: 'night',
      name: 'Night',
      bg: Color(0xFF0C0A09),
      fg: Color(0xFFE7E5E4),
      accent: Color(0xFFFBBF24),
      muted: Color(0xFFA8A29E),
      dark: true),
  const ReaderTheme(
      id: 'midnight',
      name: 'Midnight',
      bg: Color(0xFF0F172A),
      fg: Color(0xFFE2E8F0),
      accent: Color(0xFF60A5FA),
      muted: Color(0xFF94A3B8),
      dark: true),
  const ReaderTheme(
      id: 'forest',
      name: 'Forest',
      bg: Color(0xFF10241B),
      fg: Color(0xFFD1FAE5),
      accent: Color(0xFF34D399),
      muted: Color(0xFF86B4A3),
      dark: true),
  const ReaderTheme(
      id: 'eink',
      name: 'E-ink',
      bg: Color(0xFFF5F5F4),
      fg: Color(0xFF0A0A0A),
      accent: Color(0xFF171717),
      muted: Color(0xFF525252),
      dark: false),
  const ReaderTheme(
      id: 'highc',
      name: 'High Contrast',
      bg: Color(0xFF000000),
      fg: Color(0xFFFFFFFF),
      accent: Color(0xFFFFFF00),
      muted: Color(0xFFA3A3A3),
      dark: true),
  const ReaderTheme(
      id: 'burnout',
      name: 'Warm Burnout',
      bg: Color(0xFF1A1510),
      fg: Color(0xFFBFBDB6),
      accent: Color(0xFFF5C56E),
      muted: Color(0xFF686868),
      dark: true),
];

ReaderTheme resolveTheme(String themeId, List<ReaderTheme> customThemes) {
  for (final t in customThemes) {
    if (t.id == themeId) return t;
  }
  for (final t in kBuiltinThemes) {
    if (t.id == themeId) return t;
  }
  return kBuiltinThemes.first;
}

/// JLPT level → color (N5..N1 in 5..1)
const Map<int, Color> kJlptColors = {
  5: Color(0xFF0D9488), // N5 teal
  4: Color(0xFF16A34A), // N4 green
  3: Color(0xFFCA8A04), // N3 amber
  2: Color(0xFFEA580C), // N2 orange
  1: Color(0xFFDC2626), // N1 red
};
