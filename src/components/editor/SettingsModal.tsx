import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiSettings, FiTrash2, FiDownload, FiUpload } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';

interface SettingsModalProps {
  trigger?: React.ReactNode;
}

export const SettingsModal = ({ trigger }: SettingsModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [autoComplete, setAutoComplete] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState([14]);
  const [tabSize, setTabSize] = useState([2]);

  const handleDeleteAllFiles = () => {
    if (confirm('Are you sure you want to delete all files? This action cannot be undone.')) {
      localStorage.removeItem('codeEditor_files');
      window.location.reload();
    }
  };

  const handleExportProject = () => {
    const files = localStorage.getItem('codeEditor_files');
    if (files) {
      const blob = new Blob([files], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          JSON.parse(content); // Validate JSON
          localStorage.setItem('codeEditor_files', content);
          window.location.reload();
        } catch (error) {
          alert('Invalid project file format');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3"
            title="Settings"
          >
            <FiSettings className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-editor-panel via-editor-sidebar to-editor-panel border-purple-500/30">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Settings
            </DialogTitle>
            <Badge variant="secondary" className="text-xs">HardkPen v1.0</Badge>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="project">Project</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Code Editor Settings</CardTitle>
                <CardDescription>Customize your coding experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autocomplete">Auto Code Completion</Label>
                  <Switch
                    id="autocomplete"
                    checked={autoComplete}
                    onCheckedChange={setAutoComplete}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Font Size: {fontSize[0]}px</Label>
                  <Slider
                    value={fontSize}
                    onValueChange={setFontSize}
                    max={24}
                    min={10}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tab Size: {tabSize[0]} spaces</Label>
                  <Slider
                    value={tabSize}
                    onValueChange={setTabSize}
                    max={8}
                    min={2}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme & Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Color Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark Theme</SelectItem>
                      <SelectItem value="light">Light Theme</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Features</CardTitle>
                <CardDescription>Configure additional functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="minimap" />
                    <Label htmlFor="minimap">Show Minimap</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="wordwrap" />
                    <Label htmlFor="wordwrap">Word Wrap</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="linenumbers" defaultChecked />
                    <Label htmlFor="linenumbers">Line Numbers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="bracket" defaultChecked />
                    <Label htmlFor="bracket">Bracket Matching</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="project" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>Manage your project files and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExportProject}
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    Export Project
                  </Button>
                  
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportProject}
                      className="hidden"
                      id="import-file"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('import-file')?.click()}
                      className="flex items-center gap-2 w-full"
                    >
                      <FiUpload className="w-4 h-4" />
                      Import Project
                    </Button>
                  </div>
                  
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAllFiles}
                    className="flex items-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete All Files
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Storage Usage</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {((JSON.stringify(localStorage).length / 1024) / 1024).toFixed(2)} MB used
                    </Badge>
                    <Badge variant="outline">
                      Local Storage
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => {
                      localStorage.setItem('editor-settings', JSON.stringify({
                        autoComplete,
                        theme,
                        fontSize: fontSize[0],
                        tabSize: tabSize[0]
                      }));
                      alert('Settings saved!');
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};