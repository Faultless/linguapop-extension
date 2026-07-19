import 'session_client.dart';

/// One-shot OAuth handshake URL for the NHK news.web.nhk frontends. The
/// "abroad" profile auto-consents so subsequent list/article fetches carry the
/// session cookies. The pref/area/postal params are required by NHK but the
/// literal values aren't load-bearing — Tokyo defaults are the most stable.
final _authUrl = Uri.parse(
    'https://news.web.nhk/tix/build_authorize?idp=a-alaz&profileType=abroad&'
    'redirect_uri=${Uri.encodeQueryComponent('https://news.web.nhk/news/easy/')}&'
    'entity=none&area=130&pref=13&jisx0402=13101&postal=1000001');

/// Shared NHK session handshake, memoized per [SessionClient] so NHK Easy and
/// regular NHK News (same cookie domain) trigger it at most once per app
/// session between them.
class NhkAuth {
  static final Expando<Future<void>> _inflight = Expando('nhkAuth');

  static Future<void> ensure(SessionClient client) {
    return _inflight[client] ??= () async {
      try {
        await client.get(_authUrl);
      } catch (_) {
        // Best-effort: if it fails the next content fetch surfaces a clearer
        // error. Keep the future memoized to avoid a thundering herd.
      }
    }();
  }
}
