import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Palette, Terminal as TerminalIcon, Type, Monitor, Save, RotateCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  terminalOpacity: number;
  enableAnimations: boolean;
  compactMode: boolean;
}

export const Settings = () => {
  const navigate = useNavigate();
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
      terminalOpacity: 95,
      enableAnimations: true,
      compactMode: false,
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    // Apply settings to document
    document.documentElement.style.setProperty('--terminal-font', settings.terminalFont);
    document.documentElement.style.setProperty('--terminal-font-size', `${settings.terminalFontSize}px`);
    document.documentElement.style.setProperty('--editor-font', settings.editorFont);
    document.documentElement.style.setProperty('--editor-font-size', `${settings.editorFontSize}px`);
    document.documentElement.style.setProperty('--terminal-opacity', `${settings.terminalOpacity}%`);
    
    if (settings.theme !== 'auto') {
      document.documentElement.className = settings.theme;
    }
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    const defaults: AppSettings = {
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
      terminalOpacity: 95,
      enableAnimations: true,
      compactMode: false,
    };
    setSettings(defaults);
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    setHasChanges(false);
  };

  const fonts = [
    'JetBrains Mono',
    'Fira Code',
    'Source Code Pro',
    'Monaco',
    'Consolas',
    'Ubuntu Mono',
    'Roboto Mono',
    'Cascadia Code',
    'Menlo',
    'SF Mono'
  ];

  const terminalThemes = [
    { name: 'Dark', bg: '#1a1a1a', text: '#ffffff' },
    { name: 'Light', bg: '#ffffff', text: '#000000' },
    { name: 'Matrix', bg: '#0d1117', text: '#00ff00' },
    { name: 'Ocean', bg: '#0f3460', text: '#e6f3ff' },
    { name: 'Sunset', bg: '#2d1b69', text: '#ffd700' },
    { name: 'Forest', bg: '#1a2e05', text: '#90ee90' },
    { name: 'Retro', bg: '#2e1065', text: '#ff69b4' },
    { name: 'Terminal', bg: '#282c34', text: '#abb2bf' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="h-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Editor
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Customize your development environment</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="h-8"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={saveSettings}
              size="sm"
              className="h-8"
              disabled={!hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Settings Content */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="appearance" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="theme">Color Theme</Label>
                      <Select value={settings.theme} onValueChange={(value: any) => updateSetting('theme', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="auto">Auto (System)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="animations">Enable Animations</Label>
                        <p className="text-sm text-muted-foreground">Smooth transitions and effects</p>
                      </div>
                      <Switch
                        checked={settings.enableAnimations}
                        onCheckedChange={(checked) => updateSetting('enableAnimations', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="compact">Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">Reduce spacing and padding</p>
                      </div>
                      <Switch
                        checked={settings.compactMode}
                        onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Preview</Label>
                      <div className="border rounded-lg p-4 bg-card space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="text-sm font-mono">{'> console.log("Hello World!");'}</div>
                        <div className="text-sm text-green-400">Hello World!</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="terminal" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="terminal-font">Font Family</Label>
                      <Select value={settings.terminalFont} onValueChange={(value) => updateSetting('terminalFont', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fonts.map(font => (
                            <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                              {font}
                            </SelectItem>
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
                      <Label htmlFor="terminal-opacity">Terminal Opacity: {settings.terminalOpacity}%</Label>
                      <Slider
                        value={[settings.terminalOpacity]}
                        onValueChange={([value]) => updateSetting('terminalOpacity', value)}
                        min={70}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
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

                  <div className="space-y-4">
                    <div>
                      <Label>Terminal Themes</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {terminalThemes.map(theme => (
                          <button
                            key={theme.name}
                            className="p-3 rounded border-2 border-border hover:border-primary transition-colors text-center"
                            style={{ backgroundColor: theme.bg, color: theme.text }}
                            onClick={() => {
                              updateSetting('terminalBackground', theme.bg);
                              updateSetting('terminalTextColor', theme.text);
                            }}
                          >
                            <div className="text-xs font-mono">$ echo "{theme.name}"</div>
                            <div className="text-xs">{theme.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Terminal Preview</Label>
                      <div 
                        className="border rounded-lg p-4 font-mono text-sm"
                        style={{ 
                          backgroundColor: settings.terminalBackground, 
                          color: settings.terminalTextColor,
                          fontFamily: settings.terminalFont,
                          fontSize: `${settings.terminalFontSize}px`,
                          opacity: settings.terminalOpacity / 100
                        }}
                      >
                        <div>$ python hello.py</div>
                        <div>Hello, World!</div>
                        <div>$ js console.log("Test")</div>
                        <div>Test</div>
                        <div>$ _</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="editor" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editor-font">Font Family</Label>
                      <Select value={settings.editorFont} onValueChange={(value) => updateSetting('editorFont', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fonts.map(font => (
                            <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                              {font}
                            </SelectItem>
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

                  <div className="space-y-4">
                    <div>
                      <Label>Code Preview</Label>
                      <div 
                        className="border rounded-lg p-4 bg-card"
                        style={{
                          fontFamily: settings.editorFont,
                          fontSize: `${settings.editorFontSize}px`
                        }}
                      >
                        <div className="font-mono">
                          {settings.lineNumbers && <span className="text-muted-foreground mr-4">1</span>}
                          <span className="text-blue-500">function</span>{' '}
                          <span className="text-yellow-500">greet</span>
                          <span>(</span>
                          <span className="text-orange-500">name</span>
                          <span>) {'{'}</span>
                        </div>
                        <div className="font-mono">
                          {settings.lineNumbers && <span className="text-muted-foreground mr-4">2</span>}
                          <span style={{ marginLeft: `${settings.editorTabSize * 8}px` }}>
                            <span className="text-blue-500">return</span>{' '}
                            <span className="text-green-500">`Hello, ${'{'}name{'}'}`</span>;
                          </span>
                        </div>
                        <div className="font-mono">
                          {settings.lineNumbers && <span className="text-muted-foreground mr-4">3</span>}
                          <span>{'}'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                    <div className="p-4 border rounded-lg bg-card">
                      <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Save File</span>
                          <code className="bg-muted px-2 py-1 rounded">Ctrl+S</code>
                        </div>
                        <div className="flex justify-between">
                          <span>New File</span>
                          <code className="bg-muted px-2 py-1 rounded">Ctrl+N</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Open Terminal</span>
                          <code className="bg-muted px-2 py-1 rounded">Ctrl+`</code>
                        </div>
                        <div className="flex justify-between">
                          <span>Run Code</span>
                          <code className="bg-muted px-2 py-1 rounded">Ctrl+Enter</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-card">
                      <h4 className="font-medium mb-2">Application Info</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Version</span>
                          <span>2.0.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Build</span>
                          <span>Production</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated</span>
                          <span>{new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-card">
                      <h4 className="font-medium mb-2">Storage</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Settings</span>
                          <span>{(JSON.stringify(settings).length / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cache</span>
                          <span>~2.5 MB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};