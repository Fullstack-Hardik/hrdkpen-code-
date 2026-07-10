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

export interface EditorSettings {
  theme: 'smart-dark' | 'vs-light' | 'monokai' | 'github-dark';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
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
