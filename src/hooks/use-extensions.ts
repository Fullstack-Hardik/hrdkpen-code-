/**
 * use-extensions.ts — HRDK Pen Extension Registry
 *
 * Lightweight built-in extension system. Each extension is a simple record
 * with an id, metadata, and an optional action function.
 * Extensions are persisted to localStorage and toggled from the Settings panel.
 */

import { useState, useCallback } from 'react';
import type { Extension } from '@/types';

const STORAGE_KEY = 'hrdkpen_extensions_v1';

const BUILT_IN_EXTENSIONS: Extension[] = [
  {
    id: 'prettier',
    name: 'Prettier',
    description: 'Opinionated code formatter for JS, TS, HTML, CSS, JSON, and Markdown.',
    category: 'formatter',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'eslint-linter',
    name: 'ESLint',
    description: 'Integrates ESLint into the editor to automatically detect and fix problematic patterns in your code.',
    category: 'linter',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'react-snippets',
    name: 'React Snippets',
    description: 'Essential React snippets and boilerplates (e.g., rfce, useState, useEffect).',
    category: 'snippets',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'auto-import',
    name: 'Auto Import',
    description: 'Automatically finds, parses and provides code actions and code completion for all available imports.',
    category: 'utility',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'tailwind-intellisense',
    name: 'Tailwind CSS IntelliSense',
    description: 'Intelligent Tailwind CSS tooling for autocomplete, syntax highlighting, and linting.',
    category: 'autocomplete',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'path-intellisense',
    name: 'Path Intellisense',
    description: 'Autocompletes filenames and directory paths in import statements.',
    category: 'autocomplete',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Automatically formats and validates JSON files on save.',
    category: 'formatter',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'auto-close-tag',
    name: 'Auto Close Tag',
    description: 'Automatically adds closing tags for HTML, JSX, and XML.',
    category: 'utility',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'auto-rename-tag',
    name: 'Auto Rename Tag',
    description: 'When renaming an opening tag, auto-renames the closing tag.',
    category: 'utility',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Inline color picker for CSS color values.',
    category: 'utility',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Preview',
    description: 'Live side-by-side preview for .md files.',
    category: 'preview',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'live-preview-helper',
    name: 'Live Preview Helper',
    description: 'Injects helpful debug utilities into the preview frame.',
    category: 'preview',
    enabled: false,
    builtIn: true,
  },
];

function loadExtensions(): Extension[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BUILT_IN_EXTENSIONS;

    const saved: { id: string; enabled: boolean }[] = JSON.parse(raw);
    // Merge saved enabled states with the canonical built-in list
    return BUILT_IN_EXTENSIONS.map(ext => {
      const saved_ext = saved.find(s => s.id === ext.id);
      return saved_ext ? { ...ext, enabled: saved_ext.enabled } : ext;
    });
  } catch {
    return BUILT_IN_EXTENSIONS;
  }
}

function persistExtensions(exts: Extension[]) {
  try {
    const toSave = exts.map(e => ({ id: e.id, enabled: e.enabled }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Non-critical
  }
}

export function useExtensions() {
  const [extensions, setExtensions] = useState<Extension[]>(loadExtensions);

  const toggle = useCallback((id: string, enabled: boolean) => {
    setExtensions(prev => {
      const next = prev.map(e => e.id === id ? { ...e, enabled } : e);
      persistExtensions(next);
      return next;
    });
  }, []);

  const isEnabled = useCallback(
    (id: string) => extensions.find(e => e.id === id)?.enabled ?? false,
    [extensions]
  );

  return { extensions, toggle, isEnabled };
}
