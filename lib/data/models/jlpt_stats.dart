class JlptStats {
  final int n5;
  final int n4;
  final int n3;
  final int n2;
  final int n1;
  final int unknown;
  final int total;
  final int version;

  const JlptStats({
    this.n5 = 0,
    this.n4 = 0,
    this.n3 = 0,
    this.n2 = 0,
    this.n1 = 0,
    this.unknown = 0,
    this.total = 0,
    this.version = 1,
  });

  /// Weighted-average difficulty in [1..5] where 1 = easiest (N5), 5 = hardest (N1).
  /// Returns null if no classified tokens.
  double? get difficultyScore {
    final classified = n5 + n4 + n3 + n2 + n1;
    if (classified == 0) return null;
    final weighted = n5 * 1 + n4 * 2 + n3 * 3 + n2 * 4 + n1 * 5;
    return weighted / classified;
  }

  /// Closest JLPT level bucket for display, 5..1 (N5..N1). Null if no data.
  int? get difficultyBucket {
    final s = difficultyScore;
    if (s == null) return null;
    final rounded = s.round().clamp(1, 5);
    // score 1 = N5, score 5 = N1
    return 6 - rounded;
  }

  Map<String, dynamic> toJson() => {
        'n5': n5,
        'n4': n4,
        'n3': n3,
        'n2': n2,
        'n1': n1,
        'unknown': unknown,
        'total': total,
        'version': version,
      };

  factory JlptStats.fromJson(Map<String, dynamic> j) => JlptStats(
        n5: (j['n5'] as num?)?.toInt() ?? 0,
        n4: (j['n4'] as num?)?.toInt() ?? 0,
        n3: (j['n3'] as num?)?.toInt() ?? 0,
        n2: (j['n2'] as num?)?.toInt() ?? 0,
        n1: (j['n1'] as num?)?.toInt() ?? 0,
        unknown: (j['unknown'] as num?)?.toInt() ?? 0,
        total: (j['total'] as num?)?.toInt() ?? 0,
        version: (j['version'] as num?)?.toInt() ?? 1,
      );
}
