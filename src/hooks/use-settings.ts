import { useState, useEffect, useCallback } from 'react';
import type { EditorSettings } from '@/types';

const STORAGE_KEY = 'hrdkpen_settings';

const DEFAULTS: EditorSettings = {
  theme: 'smart-dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Fira Code, Monaco, monospace',
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  autoSave: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = useCallback(<K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULTS), []);

  return { settings, update, reset };
}
