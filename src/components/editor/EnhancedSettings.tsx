import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Trash2, Download, Upload, Code, Palette, Terminal, Users, Shield, Zap, Moon, Sun, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TeamCodeSettings } from './TeamCodeSettings';

interface EnhancedSettingsProps {
  onClose: () => void;
}

interface AppSettings {
  // Editor Settings
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: boolean;
  autoComplete: boolean;
  autoCompleteDelay: number;
  
  // Theme Settings
  theme: 'light' | 'dark' | 'auto';
  editorTheme: string;
  colorScheme: string;
  
  // Terminal Settings
  terminalFont: string;
  terminalFontSize: number;
  terminalMaxHistory: number;
  
  // UI Settings
  sidebarWidth: number;
  panelHeight: number;
  showMinimap: boolean;
  showStatusBar: boolean;
  compactMode: boolean;
  
  // Privacy & Data
  telemetry: boolean;
  crashReports: boolean;
  usageAnalytics: boolean;
}

const defaultSettings: AppSettings = {
  fontSize: 14,
  fontFamily: 'Fira Code',
  lineHeight: 1.5,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  minimap: false,
  autoSave: true,
  autoComplete: true,
  autoCompleteDelay: 4,
  theme: 'dark',
  editorTheme: 'vs-dark',
  colorScheme: 'default',
  terminalFont: 'Fira Code',
  terminalFontSize: 13,
  terminalMaxHistory: 1000,
  sidebarWidth: 250,
  panelHeight: 200,
  showMinimap: false,
  showStatusBar: true,
  compactMode: false,
  telemetry: false,
  crashReports: true,
  usageAnalytics: false
};

export const EnhancedSettings = ({ onClose }: EnhancedSettingsProps) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('enhanced-app-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    try {
      localStorage.setItem('enhanced-app-settings', JSON.stringify(settings));
      
      // Apply theme changes immediately
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Auto theme
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
      }
      
      // Apply CSS variables for dynamic settings
      document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
      document.documentElement.style.setProperty('--terminal-font-size', `${settings.terminalFontSize}px`);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setIsDirty(false);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    });
  };

  const exportSettings = () => {
    try {
      const data = JSON.stringify(settings, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'codespace-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Settings Exported",
        description: "Your settings have been exported to a JSON file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export settings.",
        variant: "destructive"
      });
    }
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...imported });
        setIsDirty(true);
        
        toast({
          title: "Settings Imported",
          description: "Your settings have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid settings file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    try {
      // Clear all localStorage data
      localStorage.clear();
      // Reset settings
      setSettings(defaultSettings);
      setIsDirty(false);
      
      toast({
        title: "Data Cleared",
        description: "All application data has been cleared.",
      });
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear application data.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-editor-sidebar border-editor-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-editor-header">
          <div>
            <CardTitle className="text-xl text-editor-text">Settings</CardTitle>
            <CardDescription className="text-editor-text-muted">
              Customize your CodeSpace Pro experience
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-editor-text-muted hover:text-editor-text"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-editor-panel">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="terminal" className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Terminal
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="editor" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-editor-panel border-editor-border">
                    <CardHeader>
                      <CardTitle className="text-editor-text">Code Editing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-editor-text">Font Size</label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[settings.fontSize]}
                            onValueChange={([value]) => updateSetting('fontSize', value)}
                            min={10}
                            max={24}
                            step={1}
                            className="w-20"
                          />
                          <span className="text-xs text-editor-text-muted w-8">{settings.fontSize}px</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm text-editor-text">Font Family</label>
                        <Select value={settings.fontFamily} onValueChange={(value) => updateSetting('fontFamily', value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fira Code">Fira Code</SelectItem>
                            <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                            <SelectItem value="Monaco">Monaco</SelectItem>
                            <SelectItem value="Consolas">Consolas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm text-editor-text">Tab Size</label>
                        <Select value={settings.tabSize.toString()} onValueChange={(value) => updateSetting('tabSize', parseInt(value))}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm text-editor-text">Word Wrap</label>
                        <Switch
                          checked={settings.wordWrap}
                          onCheckedChange={(checked) => updateSetting('wordWrap', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm text-editor-text">Line Numbers</label>
                        <Switch
                          checked={settings.lineNumbers}
                          onCheckedChange={(checked) => updateSetting('lineNumbers', checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-editor-panel border-editor-border">
                    <CardHeader>
                      <CardTitle className="text-editor-text">Smart Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-editor-text">Auto Save</label>
                        <Switch
                          checked={settings.autoSave}
                          onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm text-editor-text">Auto Complete</label>
                        <Switch
                          checked={settings.autoComplete}
                          onCheckedChange={(checked) => updateSetting('autoComplete', checked)}
                        />
                      </div>

                      {settings.autoComplete && (
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-editor-text">Suggestion Delay</label>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[settings.autoCompleteDelay]}
                              onValueChange={([value]) => updateSetting('autoCompleteDelay', value)}
                              min={1}
                              max={10}
                              step={1}
                              className="w-20"
                            />
                            <span className="text-xs text-editor-text-muted w-8">{settings.autoCompleteDelay}s</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <label className="text-sm text-editor-text">Minimap</label>
                        <Switch
                          checked={settings.minimap}
                          onCheckedChange={(checked) => updateSetting('minimap', checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6 mt-0">
                <Card className="bg-editor-panel border-editor-border">
                  <CardHeader>
                    <CardTitle className="text-editor-text">Theme & Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-editor-text">Application Theme</label>
                      <Select value={settings.theme} onValueChange={(value: 'light' | 'dark' | 'auto') => updateSetting('theme', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="w-4 h-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="w-4 h-4" />
                              Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="auto">
                            <div className="flex items-center gap-2">
                              <Monitor className="w-4 h-4" />
                              Auto
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-editor-text">Editor Theme</label>
                      <Select value={settings.editorTheme} onValueChange={(value) => updateSetting('editorTheme', value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vs-dark">VS Dark</SelectItem>
                          <SelectItem value="vs-light">VS Light</SelectItem>
                          <SelectItem value="hc-black">High Contrast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-editor-text">Compact Mode</label>
                      <Switch
                        checked={settings.compactMode}
                        onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="terminal" className="space-y-6 mt-0">
                <Card className="bg-editor-panel border-editor-border">
                  <CardHeader>
                    <CardTitle className="text-editor-text">Terminal Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-editor-text">Terminal Font</label>
                      <Select value={settings.terminalFont} onValueChange={(value) => updateSetting('terminalFont', value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fira Code">Fira Code</SelectItem>
                          <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                          <SelectItem value="Monaco">Monaco</SelectItem>
                          <SelectItem value="Consolas">Consolas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-editor-text">Font Size</label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[settings.terminalFontSize]}
                          onValueChange={([value]) => updateSetting('terminalFontSize', value)}
                          min={10}
                          max={20}
                          step={1}
                          className="w-20"
                        />
                        <span className="text-xs text-editor-text-muted w-8">{settings.terminalFontSize}px</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-editor-text">Max History Lines</label>
                      <Select value={settings.terminalMaxHistory.toString()} onValueChange={(value) => updateSetting('terminalMaxHistory', parseInt(value))}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500</SelectItem>
                          <SelectItem value="1000">1000</SelectItem>
                          <SelectItem value="2000">2000</SelectItem>
                          <SelectItem value="5000">5000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-6 mt-0">
                <TeamCodeSettings />
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6 mt-0">
                <Card className="bg-editor-panel border-editor-border">
                  <CardHeader>
                    <CardTitle className="text-editor-text">Privacy & Data</CardTitle>
                    <CardDescription className="text-editor-text-muted">
                      Control what data is collected and shared
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm text-editor-text">Telemetry</label>
                        <p className="text-xs text-editor-text-muted">Help improve the app by sharing usage data</p>
                      </div>
                      <Switch
                        checked={settings.telemetry}
                        onCheckedChange={(checked) => updateSetting('telemetry', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm text-editor-text">Crash Reports</label>
                        <p className="text-xs text-editor-text-muted">Automatically send crash reports to help fix bugs</p>
                      </div>
                      <Switch
                        checked={settings.crashReports}
                        onCheckedChange={(checked) => updateSetting('crashReports', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm text-editor-text">Usage Analytics</label>
                        <p className="text-xs text-editor-text-muted">Anonymous usage statistics for feature improvement</p>
                      </div>
                      <Switch
                        checked={settings.usageAnalytics}
                        onCheckedChange={(checked) => updateSetting('usageAnalytics', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-editor-panel border-editor-border">
                    <CardHeader>
                      <CardTitle className="text-editor-text">Import/Export</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={exportSettings}
                        className="w-full bg-editor-accent hover:bg-editor-accent/80"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Settings
                      </Button>
                      
                      <div>
                        <input
                          type="file"
                          accept=".json"
                          onChange={importSettings}
                          className="hidden"
                          id="import-settings"
                        />
                        <Button
                          asChild
                          variant="outline"
                          className="w-full border-editor-border"
                        >
                          <label htmlFor="import-settings" className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Import Settings
                          </label>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-editor-panel border-editor-border">
                    <CardHeader>
                      <CardTitle className="text-editor-text text-red-500">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Reset All Settings
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-editor-sidebar border-editor-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-editor-text">Reset All Settings?</AlertDialogTitle>
                            <AlertDialogDescription className="text-editor-text-muted">
                              This will reset all settings to their default values. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-editor-panel border-editor-border text-editor-text">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={resetSettings} className="bg-red-600 hover:bg-red-700">
                              Reset Settings
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full border-red-600 text-red-600 hover:bg-red-600/10">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All Data
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-editor-sidebar border-editor-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-editor-text">Clear All Application Data?</AlertDialogTitle>
                            <AlertDialogDescription className="text-editor-text-muted">
                              This will delete all your settings, projects, and cached data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-editor-panel border-editor-border text-editor-text">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={clearAllData} className="bg-red-600 hover:bg-red-700">
                              Clear All Data
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </div>

                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>Tip:</strong> You can backup your settings regularly by exporting them to a JSON file.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>

        <div className="p-4 border-t border-editor-border bg-editor-header flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isDirty && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-editor-border text-editor-text"
            >
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};