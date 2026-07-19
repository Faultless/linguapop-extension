// Quick debugger for the NHK auth handshake. Prints out what SessionClient
// captured during each leg, so we can see whether the JWT cookie made it in.

import 'package:linguapop/services/sources/session_client.dart';

Future<void> main() async {
  final client = SessionClient();

  print('1) Fetching auth URL…');
  final authRes = await client.get(Uri.parse(
      'https://news.web.nhk/tix/build_authorize?idp=a-alaz&profileType=abroad'
      '&redirect_uri=https%3A%2F%2Fnews.web.nhk%2Fnews%2Feasy%2F'
      '&entity=none&area=130&pref=13&jisx0402=13101&postal=1000001'));
  print('   → HTTP ${authRes.statusCode}  (${authRes.body.length} bytes)');

  print('   captured cookies after handshake:');
  for (final e in client.dumpCookies().entries) {
    final v = e.value.length > 50 ? '${e.value.substring(0, 50)}…' : e.value;
    print('     ${e.key} = $v');
  }
  print('');
  print('2) Now fetching top-list.json…');
  final listRes =
      await client.get(Uri.parse('https://news.web.nhk/news/easy/top-list.json'));
  print('   → HTTP ${listRes.statusCode}');
  if (listRes.statusCode != 200) {
    print('   body: ${listRes.body.substring(0, listRes.body.length.clamp(0, 300))}');
  } else {
    print('   ✓ got data');
  }

  client.close();
}
