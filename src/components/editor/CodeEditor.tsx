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
  onErrors?: (errors: { line: number; message: string }[]) => void;
}

export const CodeEditor = ({ value, onChange, language, fileName, onRun, onErrors }: CodeEditorProps) => {
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

    // Enhanced Language Support for JavaScript/TypeScript
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

    // Python Language Support with common keywords and snippets
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: () => {
        return {
          suggestions: [
            { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print(${1:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Print to console' },
            { label: 'def', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'def ${1:function_name}(${2:params}):\n\t${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Define function' },
            { label: 'class', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'class ${1:ClassName}:\n\tdef __init__(self${2:, params}):\n\t\t${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Define class' },
            { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if ${1:condition}:\n\t${2:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'If statement' },
            { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'For loop' },
            { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while ${1:condition}:\n\t${2:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'While loop' },
            { label: 'import', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'import ${1:module}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Import module' },
            { label: 'from', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'from ${1:module} import ${2:name}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Import from module' },
            { label: 'try', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Try-except block' },
            { label: 'with', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'with ${1:expression} as ${2:variable}:\n\t${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'With statement' },
            // Common Python libraries
            { label: 'numpy', kind: monaco.languages.CompletionItemKind.Module, insertText: 'import numpy as np', documentation: 'NumPy library' },
            { label: 'pandas', kind: monaco.languages.CompletionItemKind.Module, insertText: 'import pandas as pd', documentation: 'Pandas library' },
            { label: 'matplotlib', kind: monaco.languages.CompletionItemKind.Module, insertText: 'import matplotlib.pyplot as plt', documentation: 'Matplotlib library' },
          ]
        };
      }
    });

    // Java Language Support
    monaco.languages.registerCompletionItemProvider('java', {
      provideCompletionItems: () => {
        return {
          suggestions: [
            { label: 'public class', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'public class ${1:ClassName} {\n\tpublic static void main(String[] args) {\n\t\t${2:// code}\n\t}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Public class with main method' },
            { label: 'System.out.println', kind: monaco.languages.CompletionItemKind.Function, insertText: 'System.out.println(${1:message});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Print to console' },
            { label: 'public static void', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'public static void ${1:methodName}(${2:params}) {\n\t${3:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Static method' },
            { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'If statement' },
            { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n\t${4:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'For loop' },
            { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while (${1:condition}) {\n\t${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'While loop' },
            { label: 'try-catch', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try {\n\t${1:// code}\n} catch (${2:Exception} ${3:e}) {\n\t${4:// handle}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Try-catch block' },
          ]
        };
      }
    });

    // C/C++ Language Support
    const cppSuggestions = [
      { label: '#include', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '#include <${1:iostream}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Include header' },
      { label: 'main', kind: monaco.languages.CompletionItemKind.Function, insertText: 'int main() {\n\t${1:// code}\n\treturn 0;\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Main function' },
      { label: 'printf', kind: monaco.languages.CompletionItemKind.Function, insertText: 'printf("${1:format}", ${2:args});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Print formatted' },
      { label: 'cout', kind: monaco.languages.CompletionItemKind.Function, insertText: 'std::cout << ${1:value} << std::endl;', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'C++ output' },
      { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'If statement' },
      { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n\t${4:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'For loop' },
      { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while (${1:condition}) {\n\t${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'While loop' },
    ];
    
    monaco.languages.registerCompletionItemProvider('c', {
      provideCompletionItems: () => ({ suggestions: cppSuggestions })
    });
    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: () => ({ suggestions: cppSuggestions })
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
    const runnableLanguages = ['javascript', 'typescript', 'python', 'java', 'c', 'cpp'];
    if (runnableLanguages.includes(language)) {
      setIsRunning(true);
      const code = editorRef.current?.getValue?.() ?? value;
      onRun?.(code, language, fileName);
      setTimeout(() => setIsRunning(false), 500);
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
          
          {['javascript', 'typescript', 'python', 'java', 'c', 'cpp'].includes(language) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRun}
              disabled={isRunning}
              className="h-7 px-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm hover:shadow-md transition-all"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
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