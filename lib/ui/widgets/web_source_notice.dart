import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/novels_provider.dart';
import '../../services/sample/sample_content.dart';
import 'mini_toast.dart';

/// Shown on Flutter web where live source browsing is unavailable:
/// the adapters need `dart:io` networking (cookie-driven redirect flows)
/// and cross-origin fetches to news sites are blocked by browser CORS
/// anyway. Web users still get the full reader via file import, plus a
/// one-tap way to load bundled sample content so there's something to
/// read immediately.
class WebSourceNotice extends ConsumerStatefulWidget {
  const WebSourceNotice({super.key});

  @override
  ConsumerState<WebSourceNotice> createState() => _WebSourceNoticeState();
}

class _WebSourceNoticeState extends ConsumerState<WebSourceNotice> {
  bool _loading = false;

  Future<void> _loadSample() async {
    setState(() => _loading = true);
    try {
      await SampleContentService(ref.read(novelsProvider.notifier)).loadAll();
      if (mounted) {
        MiniToast.show(context, 'Sample content added ✓');
        context.go('/');
      }
    } catch (_) {
      if (mounted) MiniToast.show(context, 'Could not load sample content');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.public_off,
                  size: 56, color: theme.colorScheme.primary),
              const SizedBox(height: 20),
              Text(
                'Live sources need the app',
                style: theme.textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Browsing NHK, Mainichi, and Syosetsu directly isn\'t '
                'possible in the browser — those integrations rely on '
                'native networking that web pages aren\'t allowed to do. '
                'Install the Android app for live feeds.\n\n'
                'Everything else works right here: tap Add in the library '
                'to import an EPUB or TXT file and read it with full '
                'JLPT color-grading and dictionary lookups.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: _loading ? null : _loadSample,
                icon: _loading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.auto_stories_outlined, size: 18),
                label: const Text('Load a sample story + article'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
