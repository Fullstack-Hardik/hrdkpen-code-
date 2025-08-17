import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { emmetHTML, emmetCSS } from 'emmet-monaco-es';
import { Button } from '@/components/ui/button';
import { Play, Save, Download, RotateCcw } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  fileName: string;
  onRun?: (code: string, language: string, fileName: string) => void;
}

export const CodeEditor = ({ value, onChange, language, fileName, onRun }: CodeEditorProps) => {
  const editorRef = useRef<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure Monaco Editor with VS Code-like settings
    monaco.editor.defineTheme('smart-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'comment', foreground: '6A9955' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'delimiter', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#cdd6f4',
        'editorLineNumber.foreground': '#6c7086',
        'editor.selectionBackground': '#45475a',
        'editor.lineHighlightBackground': '#313244',
        'editorCursor.foreground': '#f5e0dc',
        'editor.wordHighlightBackground': '#45475a',
        'editor.wordHighlightStrongBackground': '#585b70',
      }
    });
    
    monaco.editor.setTheme('smart-dark');
    
    // Enable Emmet and enhance language services
    try {
      emmetHTML(monaco);
      emmetCSS(monaco);
    } catch (e) {
      console.warn('Emmet init failed', e);
    }

    // Stronger JS/TS IntelliSense
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      allowJs: true,
      checkJs: false,
      allowNonTsExtensions: true,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      lib: ['es2020', 'dom'],
    });
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      lib: ['es2020', 'dom'],
    });
    
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });
  };

  const handleSave = () => {
    // Auto-save functionality will be implemented
    console.log('Saving file:', fileName);
  };

  const handleRun = () => {
    if (language === 'javascript' || language === 'typescript') {
      setIsRunning(true);
      const code = editorRef.current?.getValue?.() ?? value;
      onRun?.(code, language, fileName);
      setTimeout(() => setIsRunning(false), 200);
    }
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 editor-header border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-editor-text">{fileName}</span>
          <div className="w-2 h-2 rounded-full bg-editor-accent animate-pulse" />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleFormat}
            className="h-7 px-2 text-editor-text-muted hover:text-editor-text"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Format
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSave}
            className="h-7 px-2 text-editor-text-muted hover:text-editor-text"
          >
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            className="h-7 px-2 text-editor-text-muted hover:text-editor-text"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          
          {(language === 'javascript' || language === 'typescript') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRun}
              disabled={isRunning}
              className="h-7 px-2 text-editor-success hover:text-editor-success glow-accent"
            >
              <Play className="w-3 h-3 mr-1" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          value={value}
          language={language}
          onChange={(newValue) => onChange(newValue || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: 'Fira Code, JetBrains Mono, Monaco, monospace',
            fontLigatures: true,
            lineNumbers: 'on',
            rulers: [80, 120],
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true,
            renderWhitespace: 'selection',
            autoIndent: 'full',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoClosingOvertype: 'auto',
            suggestOnTriggerCharacters: true,
            tabCompletion: 'on',
            snippetSuggestions: 'inline',
            wordBasedSuggestions: 'currentDocument',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true,
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
};