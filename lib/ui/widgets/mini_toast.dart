import 'dart:async';

import 'package:flutter/material.dart';

/// A tiny, unobtrusive toast pinned to the bottom-left corner that fades in
/// and out almost instantly. Use for low-importance confirmations ("Added",
/// "Removed") where a full-width SnackBar would be heavy-handed.
///
/// Only one toast is visible at a time — a new call replaces the current one.
class MiniToast {
  static OverlayEntry? _entry;
  static _MiniToastState? _active;

  static void show(BuildContext context, String message) {
    final overlay = Overlay.maybeOf(context, rootOverlay: true);
    if (overlay == null) return;

    // Reuse the live toast if one is showing — just swap its text and restart
    // the fade timer. Avoids a flash of remove/insert.
    if (_active != null && _entry != null) {
      _active!.replace(message);
      return;
    }

    late final OverlayEntry entry;
    entry = OverlayEntry(
      builder: (ctx) => _MiniToast(
        message: message,
        onStateCreated: (s) => _active = s,
        onDismiss: () {
          if (_entry == entry) {
            entry.remove();
            _entry = null;
            _active = null;
          }
        },
      ),
    );
    _entry = entry;
    overlay.insert(entry);
  }
}

class _MiniToast extends StatefulWidget {
  final String message;
  final ValueChanged<_MiniToastState> onStateCreated;
  final VoidCallback onDismiss;
  const _MiniToast({
    required this.message,
    required this.onStateCreated,
    required this.onDismiss,
  });

  @override
  State<_MiniToast> createState() => _MiniToastState();
}

class _MiniToastState extends State<_MiniToast>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late String _message;
  Timer? _hold;

  // Snappy: in fast, brief hold, out fast.
  static const _fadeIn = Duration(milliseconds: 90);
  static const _fadeOut = Duration(milliseconds: 180);
  static const _hold0 = Duration(milliseconds: 650);

  @override
  void initState() {
    super.initState();
    _message = widget.message;
    _ctrl = AnimationController(
      vsync: this,
      duration: _fadeIn,
      reverseDuration: _fadeOut,
    );
    widget.onStateCreated(this);
    _ctrl.addStatusListener((s) {
      if (s == AnimationStatus.dismissed) widget.onDismiss();
    });
    _start();
  }

  void _start() {
    _ctrl.forward();
    _hold?.cancel();
    _hold = Timer(_fadeIn + _hold0, () {
      if (mounted) _ctrl.reverse();
    });
  }

  /// Swap the message and restart the show/hold/hide cycle in place.
  void replace(String message) {
    if (!mounted) return;
    setState(() => _message = message);
    _ctrl.forward();
    _start();
  }

  @override
  void dispose() {
    _hold?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Positioned(
      left: 12,
      bottom: 16 + MediaQuery.viewInsetsOf(context).bottom,
      child: IgnorePointer(
        child: FadeTransition(
          opacity: CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: cs.inverseSurface.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.18),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                _message,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: cs.onInverseSurface,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
