final _jpRe = RegExp(r'[぀-ゟ゠-ヿ一-鿿]');

/// Returns true when the text contains at least two characters from the
/// Hiragana / Katakana / CJK blocks. The minimum threshold avoids false
/// positives on stray kanji embedded in latin prose.
bool looksJapanese(String text) {
  if (text.isEmpty) return false;
  var count = 0;
  for (final _ in _jpRe.allMatches(text)) {
    count++;
    if (count >= 2) return true;
  }
  return false;
}
