/// A user-named library shelf. Books reference collections by [id] via
/// `NovelMeta.collectionIds`, so renaming a collection never has to rewrite the
/// novel meta list.
class Collection {
  final String id;
  String name;
  final int createdAt;

  Collection({required this.id, required this.name, required this.createdAt});

  Collection copyWith({String? name}) =>
      Collection(id: id, name: name ?? this.name, createdAt: createdAt);

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'createdAt': createdAt,
      };

  factory Collection.fromJson(Map<String, dynamic> j) => Collection(
        id: j['id'] as String,
        name: j['name'] as String? ?? '',
        createdAt: (j['createdAt'] as num?)?.toInt() ?? 0,
      );
}
