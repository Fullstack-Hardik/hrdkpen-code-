import { useState, useEffect, useCallback } from 'react';
import type { EditorSettings, AppTheme } from '@/types';

const STORAGE_KEY = 'hrdkpen_settings_v2';

const DEFAULTS: EditorSettings = {
  // Appearance
  theme: 'smart-dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Fira Code, Monaco, monospace',
  tabSize: 2,
  // Editor behaviour
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  autoSave: true,
  formatOnSave: false,
  autoCloseTags: true,
  autoRenameTags: true,
  bracketPairColorization: true,
  stickyScroll: false,
  smoothCursor: true,
  breadcrumbs: true,
  gitDecorations: true,
  indentGuides: true,
  // UI
  zenMode: false,
  // Preview
  previewAutoReload: true,
  previewSyncScroll: false,
  // Terminal
  terminalFontSize: 13,
  terminalCursorBlink: true,
};

/** Applies the active theme to <html> and triggers a CSS transition */
function applyTheme(theme: AppTheme) {
  const root = document.documentElement;

  // Remove all existing theme classes
  root.classList.forEach(cls => {
    if (cls.startsWith('theme-')) root.classList.remove(cls);
  });

  // Enable smooth transition on body for theme switch
  document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

  // Add new theme class both to html (for CSS vars) and body (legacy)
  root.classList.add(`theme-${theme}`);
  document.body.className = `theme-${theme}`;
}

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Merge with defaults to handle new keys added in future
        return { ...DEFAULTS, ...JSON.parse(raw) };
      }
      return DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  // Persist and apply theme whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('[useSettings] Failed to persist settings:', e);
    }
    applyTheme(settings.theme);
  }, [settings]);

  const update = useCallback(<K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
  }, []);

  return { settings, update, reset };
}
