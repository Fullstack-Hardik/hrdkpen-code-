import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { emmetHTML, emmetCSS } from 'emmet-monaco-es';
import type { EditorSettings } from '@/types';
import { RUNNABLE_LANGUAGES } from '@/lib/languages';

export interface EditorAPI {
  format: () => void;
  goToLine: (line: number, col: number) => void;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  fileName: string;
  fileId?: string;
  settings: EditorSettings;
  /** Called when the user triggers run (Ctrl+Enter) */
  onRun?: () => void;
  onCursorChange?: (line: number, col: number) => void;
  onErrors?: (errors: { line: number; message: string }[]) => void;
  onSelectionChange?: (text: string, pos: { top: number; left: number; height: number } | null) => void;
  /** Called once when Monaco is mounted — exposes format/goToLine imperatively */
  onEditorReady?: (api: EditorAPI) => void;
}

// Catppuccin Mocha Monaco themes — synced with index.css design tokens
const THEMES: Record<string, Parameters<any['editor']['defineTheme']>[1]> = {
  'smart-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword',    foreground: 'cba6f7' },  // mauve
      { token: 'string',     foreground: 'a6e3a1' },  // green
      { token: 'number',     foreground: 'fab387' },  // peach
      { token: 'comment',    foreground: '585b70', fontStyle: 'italic' },  // surface2
      { token: 'identifier', foreground: '89dceb' },  // sky
      { token: 'type',       foreground: '94e2d5' },  // teal
      { token: 'function',   foreground: '89b4fa' },  // blue
      { token: 'variable',   foreground: 'cdd6f4' },  // text
      { token: 'tag',        foreground: 'f38ba8' },  // red
      { token: 'attribute.name', foreground: 'fab387' }, // peach
    ],
    colors: {
      'editor.background':               '#1e1e2e',
      'editor.foreground':               '#cdd6f4',
      'editorLineNumber.foreground':     '#45475a',
      'editorLineNumber.activeForeground': '#cdd6f4',
      'editor.selectionBackground':      '#585b7044',
      'editor.lineHighlightBackground':  '#181825',
      'editorCursor.foreground':         '#f5c2e7',
      'editor.wordHighlightBackground':  '#313244',
      'editorBracketMatch.background':   '#45475a',
      'editorBracketMatch.border':       '#89b4fa',
      'editorGutter.background':         '#1e1e2e',
      'editorWidget.background':         '#181825',
      'editorSuggestWidget.background':  '#181825',
      'editorSuggestWidget.border':      '#313244',
      'editorSuggestWidget.selectedBackground': '#313244',
      'input.background':                '#181825',
      'dropdown.background':             '#181825',
    },
  },
  'github-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword',  foreground: 'ff7b72' },
      { token: 'string',   foreground: 'a5d6ff' },
      { token: 'number',   foreground: '79c0ff' },
      { token: 'comment',  foreground: '8b949e', fontStyle: 'italic' },
      { token: 'type',     foreground: 'ffa657' },
    ],
    colors: {
      'editor.background':           '#0d1117',
      'editor.foreground':           '#e6edf3',
      'editorLineNumber.foreground': '#484f58',
      'editor.lineHighlightBackground': '#161b22',
    },
  },
  'monokai': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword',  foreground: 'F92672' },
      { token: 'string',   foreground: 'E6DB74' },
      { token: 'number',   foreground: 'AE81FF' },
      { token: 'comment',  foreground: '75715E', fontStyle: 'italic' },
      { token: 'type',     foreground: '66D9EF', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background':           '#272822',
      'editor.foreground':           '#F8F8F2',
      'editorLineNumber.foreground': '#90908A',
      'editor.lineHighlightBackground': '#3E3D32',
      'editorCursor.foreground':     '#F8F8F0',
    },
  },
};

let themesRegistered = false;

export const CodeEditor = ({
  value,
  onChange,
  language,
  fileName,
  fileId,
  settings,
  onRun,
  onCursorChange,
  onErrors,
  onSelectionChange,
  onEditorReady,
}: CodeEditorProps) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const handleMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register themes once
    if (!themesRegistered) {
      Object.entries(THEMES).forEach(([name, def]) => {
        monaco.editor.defineTheme(name, def);
      });
      themesRegistered = true;
    }
    monaco.editor.setTheme(settings.theme);

    // Emmet
    try {
      emmetHTML(monaco);
      emmetCSS(monaco);
    } catch { /* non-fatal */ }

    // JS/TS diagnostics
    const jsDefaults = monaco.languages.typescript.javascriptDefaults;
    const tsDefaults = monaco.languages.typescript.typescriptDefaults;
    jsDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
    tsDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
    jsDefaults.setCompilerOptions({
      allowJs: true, checkJs: false, allowNonTsExtensions: true,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      lib: ['es2020', 'dom'],
      jsx: monaco.languages.typescript.JsxEmit.React,
    });
    tsDefaults.setCompilerOptions({
      allowJs: true, allowNonTsExtensions: true,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      lib: ['es2020', 'dom'],
      jsx: monaco.languages.typescript.JsxEmit.React,
    });

    // C/C++ completion snippets
    const cSnippets = [
      { label: '#include', insertText: '#include <${1:stdio.h}>', documentation: 'Include header' },
      { label: 'main',     insertText: 'int main() {\n\t${1:// code}\n\treturn 0;\n}', documentation: 'Main function' },
      { label: 'printf',   insertText: 'printf("${1:%s}\\n", ${2:arg});', documentation: 'Print formatted' },
      { label: 'scanf',    insertText: 'scanf("${1:%d}", &${2:var});', documentation: 'Scan input' },
    ].map(s => ({
      ...s,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    }));

    ['c', 'cpp'].forEach(lang => {
      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: () => ({ suggestions: cSnippets }),
      });
    });

    // Python completion
    const pySnippets = [
      { label: 'def',    insertText: 'def ${1:name}(${2:params}):\n\t${3:pass}', documentation: 'Function' },
      { label: 'class',  insertText: 'class ${1:Name}:\n\tdef __init__(self):\n\t\t${2:pass}', documentation: 'Class' },
      { label: 'for',    insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}', documentation: 'For loop' },
      { label: 'while',  insertText: 'while ${1:cond}:\n\t${2:pass}', documentation: 'While loop' },
      { label: 'if',     insertText: 'if ${1:cond}:\n\t${2:pass}', documentation: 'If' },
      { label: 'try',    insertText: 'try:\n\t${1:pass}\nexcept ${2:Exception} as e:\n\t${3:pass}', documentation: 'Try/except' },
      { label: 'print',  insertText: 'print(${1:value})', documentation: 'Print' },
      { label: 'import', insertText: 'import ${1:module}', documentation: 'Import' },
      { label: 'from',   insertText: 'from ${1:module} import ${2:name}', documentation: 'From import' },
    ].map(s => ({
      ...s,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    }));
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: () => ({ suggestions: pySnippets }),
    });

    // Error markers
    monaco.editor.onDidChangeMarkers(() => {
      const markers = monaco.editor.getModelMarkers({ resource: editor.getModel()?.uri });
      onErrors?.(
        markers
          .filter((m: any) => m.severity === monaco.MarkerSeverity.Error)
          .map((m: any) => ({ line: m.startLineNumber, message: m.message }))
      );
    });

    // Cursor position
    editor.onDidChangeCursorPosition((e: any) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });

    // Selection tracking for Smart Popup
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = editor.getModel()?.getValueInRange(e.selection);
      if (!selection || !selection.trim()) {
        onSelectionChange?.('', null);
        return;
      }
      
      const startPos = editor.getScrolledVisiblePosition({
        lineNumber: e.selection.startLineNumber,
        column: e.selection.startColumn,
      });
      const endPos = editor.getScrolledVisiblePosition({
        lineNumber: e.selection.endLineNumber,
        column: e.selection.endColumn,
      });
      
      if (startPos && endPos) {
        onSelectionChange?.(selection, {
          top: startPos.top,
          left: startPos.left,
          height: Math.max(20, endPos.top - startPos.top),
        });
      } else {
        onSelectionChange?.('', null);
      }
    });

    // Expose API to parent
    onEditorReady?.({
      format: () => editor.getAction('editor.action.formatDocument')?.run(),
      goToLine: (line: number, col: number) => {
        editor.setPosition({ lineNumber: line, column: col });
        editor.revealLineInCenter(line);
        editor.focus();
      },
    });
  }, []);  

  // Sync theme when settings change
  useEffect(() => {
    monacoRef.current?.editor.setTheme(settings.theme);
  }, [settings.theme]);

  const handleRun = useCallback(() => {
    if (!RUNNABLE_LANGUAGES.has(language)) return;
    onRun?.();
  }, [language, onRun]);

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFormat = () => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  };

  const isRunnable = RUNNABLE_LANGUAGES.has(language);

  return (
    <div className="h-full min-h-0">
      <Editor
        path={fileId || fileName} // Use fileId for Monaco's model caching to preserve state across tabs
        defaultValue={value}
        defaultLanguage={language}
        onChange={v => onChange(v ?? '')}
        onMount={handleMount}
        options={{
          fontSize: settings.fontSize,
          fontFamily: settings.fontFamily,
          fontLigatures: true,
          lineNumbers: settings.lineNumbers ? 'on' : 'off',
          wordWrap: settings.wordWrap ? 'on' : 'off',
          minimap: { enabled: settings.minimap },
          tabSize: settings.tabSize,
          rulers: [80, 120],
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: false,
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: 'off',
          renderWhitespace: 'selection',
          autoIndent: 'full',
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          suggestOnTriggerCharacters: true,
          tabCompletion: 'on',
          snippetSuggestions: 'inline',
          wordBasedSuggestions: 'currentDocument',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showClasses: true,
            showFunctions: true,
            showVariables: true,
          },
          quickSuggestions: { other: true, comments: false, strings: false },
          parameterHints: { enabled: true },
          formatOnPaste: false,
          formatOnType: false,
        }}
      />
    </div>
  );
};