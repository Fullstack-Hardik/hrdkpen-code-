import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, RotateCcw, Settings2 } from 'lucide-react';
import type { EditorSettings } from '@/types';

interface SettingsPanelProps {
  settings: EditorSettings;
  onUpdate: <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => void;
  onReset: () => void;
  onClose: () => void;
}

const THEMES: { value: EditorSettings['theme']; label: string }[] = [
  { value: 'smart-dark',  label: 'Catppuccin Dark' },
  { value: 'github-dark', label: 'GitHub Dark' },
  { value: 'monokai',     label: 'Monokai' },
  { value: 'vs-light',    label: 'Visual Studio Light' },
];

const FONTS = [
  'JetBrains Mono, monospace',
  'Fira Code, monospace',
  'Cascadia Code, monospace',
  'Monaco, monospace',
  'Consolas, monospace',
  'Ubuntu Mono, monospace',
];

const FONT_LABELS: Record<string, string> = {
  'JetBrains Mono, monospace': 'JetBrains Mono',
  'Fira Code, monospace': 'Fira Code',
  'Cascadia Code, monospace': 'Cascadia Code',
  'Monaco, monospace': 'Monaco',
  'Consolas, monospace': 'Consolas',
  'Ubuntu Mono, monospace': 'Ubuntu Mono',
};

export const SettingsPanel = ({ settings, onUpdate, onReset, onClose }: SettingsPanelProps) => {
  return (
    <div className="flex flex-col h-full bg-editor-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-editor-accent" />
          <span className="text-sm font-semibold text-editor-text">Settings</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm"
            onClick={onReset}
            className="h-7 px-2 text-xs text-editor-text-muted hover:text-editor-text"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 text-editor-text-muted hover:text-editor-text"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Settings Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

        {/* Editor Theme */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-editor-text-muted uppercase tracking-wider">
            Editor Theme
          </Label>
          <Select
            value={settings.theme}
            onValueChange={v => onUpdate('theme', v as EditorSettings['theme'])}
          >
            <SelectTrigger className="h-8 text-xs bg-editor-bg border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-editor-sidebar border-border">
              {THEMES.map(t => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-editor-text-muted uppercase tracking-wider">
            Font Family
          </Label>
          <Select
            value={settings.fontFamily}
            onValueChange={v => onUpdate('fontFamily', v)}
          >
            <SelectTrigger className="h-8 text-xs bg-editor-bg border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-editor-sidebar border-border">
              {FONTS.map(f => (
                <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>
                  {FONT_LABELS[f] ?? f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-editor-text-muted uppercase tracking-wider">
              Font Size
            </Label>
            <span className="text-xs text-editor-text">{settings.fontSize}px</span>
          </div>
          <Slider
            value={[settings.fontSize]}
            onValueChange={([v]) => onUpdate('fontSize', v)}
            min={10} max={22} step={1}
          />
        </div>

        {/* Tab Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-editor-text-muted uppercase tracking-wider">
              Tab Size
            </Label>
            <span className="text-xs text-editor-text">{settings.tabSize} spaces</span>
          </div>
          <Slider
            value={[settings.tabSize]}
            onValueChange={([v]) => onUpdate('tabSize', v)}
            min={2} max={8} step={2}
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-editor-text-muted uppercase tracking-wider block">
            Editor Options
          </Label>

          {([
            ['wordWrap',    'Word Wrap'],
            ['lineNumbers', 'Line Numbers'],
            ['minimap',     'Minimap'],
            ['autoSave',    'Auto Save'],
          ] as [keyof EditorSettings, string][]).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-xs text-editor-text cursor-pointer">{label}</Label>
              <Switch
                checked={settings[key] as boolean}
                onCheckedChange={v => onUpdate(key, v)}
                className="scale-90"
              />
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-editor-text-muted uppercase tracking-wider">
            Preview
          </Label>
          <div
            className="rounded border border-border p-3 bg-editor-bg text-editor-text"
            style={{ fontFamily: settings.fontFamily, fontSize: settings.fontSize }}
          >
            <span className="text-purple-400">function</span>{' '}
            <span className="text-yellow-300">greet</span>
            <span className="text-editor-text">(</span>
            <span className="text-orange-300">name</span>
            <span className="text-editor-text">) {'{'}</span>
            <br />
            <span style={{ marginLeft: settings.tabSize * 8 }}>
              <span className="text-blue-400">return</span>{' '}
              <span className="text-green-400">`Hello, {'${name}'}!`</span>
              <span className="text-editor-text">;</span>
            </span>
            <br />
            <span className="text-editor-text">{'}'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
