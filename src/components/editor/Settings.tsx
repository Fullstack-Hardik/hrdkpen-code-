import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Terminal as TerminalIcon, Type, Monitor } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
}

interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  terminalFont: string;
  terminalFontSize: number;
  terminalBackground: string;
  terminalTextColor: string;
  editorFont: string;
  editorFontSize: number;
  editorTabSize: number;
  autoSave: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;
}

export const Settings = ({ onClose }: SettingsProps) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      terminalFont: 'JetBrains Mono',
      terminalFontSize: 14,
      terminalBackground: '#1a1a1a',
      terminalTextColor: '#ffffff',
      editorFont: 'JetBrains Mono',
      editorFontSize: 14,
      editorTabSize: 2,
      autoSave: true,
      lineNumbers: true,
      wordWrap: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    // Apply settings to document
    document.documentElement.style.setProperty('--terminal-font', settings.terminalFont);
    document.documentElement.style.setProperty('--terminal-font-size', `${settings.terminalFontSize}px`);
    document.documentElement.style.setProperty('--editor-font', settings.editorFont);
    document.documentElement.style.setProperty('--editor-font-size', `${settings.editorFontSize}px`);
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const fonts = [
    'JetBrains Mono',
    'Fira Code',
    'Source Code Pro',
    'Monaco',
    'Consolas',
    'Ubuntu Mono',
    'Roboto Mono'
  ];

  const terminalColors = [
    { name: 'Dark', bg: '#1a1a1a', text: '#ffffff' },
    { name: 'Light', bg: '#ffffff', text: '#000000' },
    { name: 'Blue', bg: '#1e3a8a', text: '#ffffff' },
    { name: 'Green', bg: '#166534', text: '#ffffff' },
    { name: 'Purple', bg: '#7c3aed', text: '#ffffff' },
    { name: 'Red', bg: '#dc2626', text: '#ffffff' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Customize your development environment</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="terminal" className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4" />
                Terminal
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                General
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value: any) => updateSetting('theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="terminal" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="terminal-font">Font Family</Label>
                  <Select value={settings.terminalFont} onValueChange={(value) => updateSetting('terminalFont', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="terminal-font-size">Font Size: {settings.terminalFontSize}px</Label>
                  <Slider
                    value={[settings.terminalFontSize]}
                    onValueChange={([value]) => updateSetting('terminalFontSize', value)}
                    min={10}
                    max={24}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Terminal Colors</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {terminalColors.map(color => (
                      <button
                        key={color.name}
                        className="p-3 rounded border-2 border-border hover:border-primary transition-colors"
                        style={{ backgroundColor: color.bg, color: color.text }}
                        onClick={() => {
                          updateSetting('terminalBackground', color.bg);
                          updateSetting('terminalTextColor', color.text);
                        }}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="terminal-bg">Background Color</Label>
                    <Input
                      type="color"
                      value={settings.terminalBackground}
                      onChange={(e) => updateSetting('terminalBackground', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="terminal-text">Text Color</Label>
                    <Input
                      type="color"
                      value={settings.terminalTextColor}
                      onChange={(e) => updateSetting('terminalTextColor', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="editor" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editor-font">Font Family</Label>
                  <Select value={settings.editorFont} onValueChange={(value) => updateSetting('editorFont', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="editor-font-size">Font Size: {settings.editorFontSize}px</Label>
                  <Slider
                    value={[settings.editorFontSize]}
                    onValueChange={([value]) => updateSetting('editorFontSize', value)}
                    min={10}
                    max={24}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="tab-size">Tab Size: {settings.editorTabSize} spaces</Label>
                  <Slider
                    value={[settings.editorTabSize]}
                    onValueChange={([value]) => updateSetting('editorTabSize', value)}
                    min={2}
                    max={8}
                    step={2}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="line-numbers">Show Line Numbers</Label>
                  <Switch
                    checked={settings.lineNumbers}
                    onCheckedChange={(checked) => updateSetting('lineNumbers', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="word-wrap">Word Wrap</Label>
                  <Switch
                    checked={settings.wordWrap}
                    onCheckedChange={(checked) => updateSetting('wordWrap', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="general" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-save">Auto Save</Label>
                    <p className="text-sm text-muted-foreground">Automatically save files while typing</p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};