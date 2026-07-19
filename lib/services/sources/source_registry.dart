import 'mainichi.dart';
import 'nhk_easy.dart';
import 'nhk_news.dart';
import 'session_client.dart';
import 'source_types.dart';
import 'syosetu.dart';

/// Built-in source adapters. Order is the order shown in the picker.
class SourceRegistry {
  final SessionClient _client;
  late final List<Source> all = [
    NhkEasySource(_client),
    NhkNewsSource(_client),
    MainichiSource(_client),
    SyosetuSource(_client),
  ];

  SourceRegistry(this._client);

  Iterable<SearchSource> get searchSources =>
      all.whereType<SearchSource>();
  Iterable<FeedSource> get feedSources => all.whereType<FeedSource>();

  Source? byId(String id) {
    for (final s in all) {
      if (s.id == id) return s;
    }
    return null;
  }
}
