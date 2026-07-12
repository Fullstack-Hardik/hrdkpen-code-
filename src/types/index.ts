// Shared TypeScript types for HRDK Pen

export type Language =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'c'
  | 'cpp'
  | 'markdown'
  | 'json'
  | 'plaintext';

export type FileNodeType = 'file' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  type: FileNodeType;
  content?: string;
  language?: Language | string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export type AppTheme =
  | 'smart-dark'
  | 'vs-light'
  | 'monokai'
  | 'github-dark'
  | 'pure-black'
  | 'graphite'
  | 'midnight'
  | 'dracula'
  | 'nord'
  | 'oceanic';

export interface EditorSettings {
  // Appearance
  theme: AppTheme;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  // Editor behaviour
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  formatOnSave: boolean;
  autoCloseTags: boolean;
  autoRenameTags: boolean;
  bracketPairColorization: boolean;
  stickyScroll: boolean;
  smoothCursor: boolean;
  breadcrumbs: boolean;
  gitDecorations: boolean;
  indentGuides: boolean;
  // UI
  zenMode: boolean;
  // Preview
  previewAutoReload: boolean;
  previewSyncScroll: boolean;
  // Terminal
  terminalFontSize: number;
  terminalCursorBlink: boolean;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  content: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Extension system
export interface Extension {
  id: string;
  name: string;
  description: string;
  category: 'formatter' | 'linter' | 'preview' | 'utility' | 'snippets' | 'autocomplete';
  enabled: boolean;
  builtIn: boolean;
}
