import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { emmetHTML, emmetCSS } from 'emmet-monaco-es';
import type { EditorSettings } from '@/types';
import { RUNNABLE_LANGUAGES } from '@/lib/languages';

export interface EditorAPI {
  format: () => void;
  goToLine: (line: number, col: number) => void;
  insertTextAtCursor: (text: string) => void;
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
  onCursorChange?: (line: number, col: number, pos?: { top: number; left: number }) => void;
  onErrors?: (errors: { line: number; message: string }[]) => void;
  onSelectionChange?: (text: string, pos: { top: number; left: number; height: number } | null) => void;
  onAIAction?: (action: 'explain' | 'fix' | 'optimize', code: string) => void;
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
    
    // Fallback if not static
    if (THEMES[settings.theme]) {
      monaco.editor.setTheme(settings.theme);
    }

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

    // Listen for cursor movement
    editor.onDidChangeCursorPosition((e: any) => {
      const { lineNumber, column } = e.position;
      const top = editor.getTopForLineNumber(lineNumber);
      const left = editor.getOffsetForColumn(lineNumber, column);
      onCursorChange?.(lineNumber, column, { top, left });
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

    // Add AI actions to context menu
    editor.addAction({
      id: 'ai-explain',
      label: '✨ AI: Explain Code',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1,
      run: (ed: any) => {
        const text = ed.getModel()?.getValueInRange(ed.getSelection());
        if (text && onAIAction) onAIAction('explain', text);
      }
    });

    editor.addAction({
      id: 'ai-fix',
      label: '✨ AI: Fix Bug',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 2,
      run: (ed: any) => {
        const text = ed.getModel()?.getValueInRange(ed.getSelection());
        if (text && onAIAction) onAIAction('fix', text);
      }
    });

    editor.addAction({
      id: 'ai-optimize',
      label: '✨ AI: Optimize Code',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 3,
      run: (ed: any) => {
        const text = ed.getModel()?.getValueInRange(ed.getSelection());
        if (text && onAIAction) onAIAction('optimize', text);
      }
    });

    // Expose API to parent
    onEditorReady?.({
      format: () => editor.getAction('editor.action.formatDocument')?.run(),
      goToLine: (line, col) => {
        editor.setPosition({ lineNumber: line, column: col });
        editor.revealPositionInCenter({ lineNumber: line, column: col });
      },
      insertTextAtCursor: (text) => {
        const position = editor.getPosition();
        if (position) {
          editor.executeEdits('ai-autocomplete', [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: text,
            forceMoveMarkers: true
          }]);
        }
      }
    });
  }, []);  

  // Sync theme when settings change
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    // Helper to convert HSL tuple to HEX for Monaco
    const hslToHex = (h: number, s: number, l: number) => {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const getHex = (varName: string, fallback: string) => {
      const val = getComputedStyle(document.body).getPropertyValue(varName).trim();
      if (!val) return fallback;
      const parts = val.replace(/%/g, '').split(/[\s,]+/).map(v => parseFloat(v));
      if (parts.length >= 3 && !isNaN(parts[0])) {
        return hslToHex(parts[0], parts[1], parts[2]);
      }
      return val.startsWith('#') ? val : fallback;
    };

    // If it's a known static theme, just use it, otherwise generate a dynamic one
    if (THEMES[settings.theme]) {
      if (!monaco.editor.getTheme || !monaco._themeInit) {
        Object.entries(THEMES).forEach(([name, def]) => monaco.editor.defineTheme(name, def));
        monaco._themeInit = true;
      }
      monaco.editor.setTheme(settings.theme);
    } else {
      const dynamicName = `dynamic-${settings.theme}`;
      monaco.editor.defineTheme(dynamicName, {
        base: settings.theme.includes('light') ? 'vs' : 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword',    foreground: getHex('--mauve', '#cba6f7').replace('#', '') },
          { token: 'string',     foreground: getHex('--green', '#a6e3a1').replace('#', '') },
          { token: 'number',     foreground: getHex('--peach', '#fab387').replace('#', '') },
          { token: 'comment',    foreground: getHex('--overlay1', '#585b70').replace('#', ''), fontStyle: 'italic' },
          { token: 'identifier', foreground: getHex('--sky', '#89dceb').replace('#', '') },
          { token: 'type',       foreground: getHex('--teal', '#94e2d5').replace('#', '') },
          { token: 'function',   foreground: getHex('--blue', '#89b4fa').replace('#', '') },
          { token: 'variable',   foreground: getHex('--text', '#cdd6f4').replace('#', '') },
        ],
        colors: {
          'editor.background':               getHex('--editor-bg', '#1e1e2e'),
          'editor.foreground':               getHex('--text', '#cdd6f4'),
          'editorLineNumber.foreground':     getHex('--overlay0', '#45475a'),
          'editorLineNumber.activeForeground': getHex('--text', '#cdd6f4'),
          'editor.selectionBackground':      getHex('--surface2', '#585b70') + '66',
          'editor.lineHighlightBackground':  getHex('--surface0', '#181825'),
          'editorCursor.foreground':         getHex('--editor-accent', '#f5c2e7'),
        }
      });
      monaco.editor.setTheme(dynamicName);
    }
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