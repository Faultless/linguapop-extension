import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../services/import/import_service.dart';

class ImportScreen extends ConsumerStatefulWidget {
  const ImportScreen({super.key});
  @override
  ConsumerState<ImportScreen> createState() => _ImportScreenState();
}

class _ImportScreenState extends ConsumerState<ImportScreen> {
  _PickedFile? _original;
  _PickedFile? _translation;
  bool _importing = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final canImport = !_importing && _original != null;
    return Scaffold(
      appBar: AppBar(title: const Text('Import')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          Text(
            'Pick an EPUB or TXT file to add to your library. You can also '
            'attach a translated version of the same book — chapters will '
            'be paired automatically.',
            style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.75),
                height: 1.4),
          ),
          const SizedBox(height: 20),
          _FilePickerCard(
            label: 'Original',
            picked: _original,
            onPick: () => _pick(false),
            onClear: () => setState(() => _original = null),
            enabled: !_importing,
          ),
          const SizedBox(height: 12),
          _FilePickerCard(
            label: 'Translation (optional)',
            picked: _translation,
            onPick: () => _pick(true),
            onClear: () => setState(() => _translation = null),
            enabled: !_importing && _original != null,
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                _error!,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onErrorContainer,
                ),
              ),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: canImport ? _runImport : null,
            icon: _importing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.add),
            label: Text(_importing ? 'Importing…' : 'Add to library'),
          ),
        ],
      ),
    );
  }

  Future<void> _pick(bool isTranslation) async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['epub', 'txt'],
      withData: true,
    );
    if (res == null || res.files.isEmpty) return;
    final f = res.files.first;
    final bytes = f.bytes;
    if (bytes == null) {
      setState(() => _error = 'Could not read "${f.name}".');
      return;
    }
    setState(() {
      _error = null;
      final picked = _PickedFile(name: f.name, bytes: bytes);
      if (isTranslation) {
        _translation = picked;
      } else {
        _original = picked;
      }
    });
  }

  Future<void> _runImport() async {
    final original = _original;
    if (original == null) return;
    setState(() {
      _importing = true;
      _error = null;
    });
    try {
      final result =
          await ref.read(importServiceProvider).importFile(
                filename: original.name,
                bytes: original.bytes,
                translationBytes: _translation?.bytes,
                translationFilename: _translation?.name,
              );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                'Imported "${result.title}" (${result.chapterCount} chapters).')),
      );
      context.go('/');
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _importing = false;
        _error = 'Import failed: $e';
      });
    }
  }
}

class _PickedFile {
  final String name;
  final Uint8List bytes;
  const _PickedFile({required this.name, required this.bytes});
}

class _FilePickerCard extends StatelessWidget {
  final String label;
  final _PickedFile? picked;
  final VoidCallback onPick;
  final VoidCallback onClear;
  final bool enabled;
  const _FilePickerCard({
    required this.label,
    required this.picked,
    required this.onPick,
    required this.onClear,
    required this.enabled,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                          color: cs.primary)),
                  const SizedBox(height: 6),
                  Text(
                    picked == null ? 'No file selected' : picked!.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: picked == null
                          ? cs.onSurface.withValues(alpha: 0.55)
                          : cs.onSurface,
                    ),
                  ),
                  if (picked != null)
                    Text(
                      '${(picked!.bytes.lengthInBytes / 1024).toStringAsFixed(1)} KB',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: cs.onSurface.withValues(alpha: 0.55),
                      ),
                    ),
                ],
              ),
            ),
            if (picked != null)
              IconButton(
                onPressed: enabled ? onClear : null,
                icon: const Icon(Icons.close, size: 18),
              ),
            TextButton.icon(
              onPressed: enabled ? onPick : null,
              icon: const Icon(Icons.folder_open_outlined, size: 18),
              label: Text(picked == null ? 'Pick' : 'Change'),
            ),
          ],
        ),
      ),
    );
  }
}
