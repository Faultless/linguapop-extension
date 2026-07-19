import 'package:flutter/material.dart';

/// Shown on Flutter web where live source browsing is unavailable:
/// the adapters need `dart:io` networking (cookie-driven redirect flows)
/// and cross-origin fetches to news sites are blocked by browser CORS
/// anyway. Web users still get the full reader via file import.
class WebSourceNotice extends StatelessWidget {
  const WebSourceNotice({super.key});

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
            ],
          ),
        ),
      ),
    );
  }
}
