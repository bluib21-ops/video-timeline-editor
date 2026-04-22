import { useEffect } from 'react';

/**
 * KeyboardShortcuts Hook
 * 
 * Provides keyboard shortcuts for common timeline editor operations
 */

interface KeyboardShortcutsProps {
  onPlayPause: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  selectedClipId: string | null;
}

export function useKeyboardShortcuts({
  onPlayPause,
  onDelete,
  onDuplicate,
  onUndo,
  onRedo,
  selectedClipId,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Space: Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        onPlayPause();
      }

      // Delete: Delete selected clip
      if (e.code === 'Delete' && selectedClipId) {
        e.preventDefault();
        onDelete();
      }

      // Ctrl+D or Cmd+D: Duplicate selected clip
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedClipId) {
        e.preventDefault();
        onDuplicate();
      }

      // Ctrl+Z or Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && onUndo) {
        e.preventDefault();
        onUndo();
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z' && onRedo) {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onDelete, onDuplicate, onUndo, onRedo, selectedClipId]);
}

export const KEYBOARD_SHORTCUTS = [
  { key: 'Space', action: 'Play/Pause' },
  { key: 'Delete', action: 'Delete selected clip' },
  { key: 'Ctrl+D', action: 'Duplicate selected clip' },
  { key: 'Ctrl+Z', action: 'Undo' },
  { key: 'Ctrl+Shift+Z', action: 'Redo' },
];
