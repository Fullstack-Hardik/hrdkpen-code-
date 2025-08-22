import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Trash2, 
  Copy, 
  Download,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { FileNode } from './FileExplorer';

interface TerminalOutput {
  id: string;
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
  timestamp: Date;
}

interface TerminalProps {
  onExecuteCode?: (code: string, language: string) => void;
  getFileSystem?: () => FileNode[];
  name?: string;
  showHeader?: boolean;
  onExit?: () => void;
  onCreateFile?: (fullPath: string) => void;
}

export type TerminalHandle = {
  runJS: (code: string) => void;
  runTS: (code: string) => void;
  execute: (cmd: string) => void;
};
export const Terminal = forwardRef<TerminalHandle, TerminalProps>(({ onExecuteCode, getFileSystem, name = 'Terminal', showHeader = true, onExit, onCreateFile }, ref) => {
  const [output, setOutput] = useState<TerminalOutput[]>([
    {
      id: '1',
      type: 'success',
      content: `${name} v1.0.0 - Ready!`,
      timestamp: new Date()
    }
  ]);
  const [command, setCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [cwd, setCwd] = useState<string>('/');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new output is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const addOutput = (type: TerminalOutput['type'], content: string) => {
    const newOutput: TerminalOutput = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      content,
      timestamp: new Date()
    };
    setOutput(prev => [...prev, newOutput]);
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    setIsExecuting(true);
    addOutput('input', `${cwd} $ ${command}`);

    try {
      if (command.startsWith('js ') || command.startsWith('javascript ')) {
        const code = command.replace(/^(js|javascript)\s+/, '');
        runJavaScript(code);
      } else if (command.startsWith('ts ') || command.startsWith('typescript ')) {
        const code = command.replace(/^(ts|typescript)\s+/, '');
        runJavaScript(code); // simplified TS support
      } else if (command.startsWith('python ') || command.startsWith('py ')) {
        const code = command.replace(/^(python|py)\s+/, '');
        runPython(code);
      } else if (command.startsWith('node ')) {
        const filename = command.replace('node ', '').trim();
        const fileSystem = getFileSystem ? getFileSystem() : [];
        const file = findFileInSystem(fileSystem, filename);
        if (file && file.content) {
          addOutput('output', `Running ${filename}...`);
          runJavaScript(file.content);
        } else {
          addOutput('error', `File not found: ${filename}`);
        }
      } else if (command.startsWith('touch ')) {
        const filename = command.replace('touch ', '').trim();
        addOutput('success', `Created file: ${filename}`);
        // Notify parent component to create the file
        onCreateFile?.(filename);
        // Force file creation in file system
        setTimeout(() => {
          addOutput('output', `File ${filename} added to explorer`);
        }, 100);
      } else if (command.startsWith('cat ')) {
        const filename = command.replace('cat ', '').trim();
        const fileSystem = getFileSystem ? getFileSystem() : [];
        const file = findFileInSystem(fileSystem, filename);
        if (file && file.content) {
          addOutput('output', file.content);
        } else {
          addOutput('error', `File not found: ${filename}`);
        }
      } else if (command === 'clear') {
        setOutput([]);
      } else if (command === 'help') {
        showHelp();
      } else if (command.startsWith('echo ')) {
        const message = command.replace('echo ', '');
        addOutput('output', message);
      } else if (command === 'pwd') {
        addOutput('output', cwd);
      } else if (command === 'ls') {
        const list = listDir(cwd);
        addOutput('output', list.join('  '));
      } else if (command.startsWith('cd ')) {
        const path = command.replace('cd ', '').trim();
        const next = resolvePath(cwd, path);
        if (isDir(next)) {
          setCwd(next);
          addOutput('success', `Directory changed to ${next}`);
        } else {
          addOutput('error', `No such directory: ${path}`);
        }
      } else if (command === 'exit' || command === 'kill') {
        addOutput('success', 'Session terminated');
        onExit?.();
      } else {
        // Try to execute as JavaScript by default
        runJavaScript(command);
      }
    } catch (error) {
      addOutput('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setCommand('');
    setIsExecuting(false);
  };

  const findFileInSystem = (files: FileNode[], filename: string): FileNode | null => {
    for (const file of files) {
      if (file.type === 'file' && file.name === filename) {
        return file;
      }
      if (file.children) {
        const found = findFileInSystem(file.children, filename);
        if (found) return found;
      }
    }
    return null;
  };

  const runJavaScript = (code: string) => {
    try {
      const originalConsole = console.log;
      const originalError = console.error;
      const logs: string[] = [];
      const errors: string[] = [];
      
      console.log = (...args) => {
        logs.push(args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };

      console.error = (...args) => {
        errors.push(args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };

      let result;
      try {
        result = eval(code);
      } catch (syntaxError) {
        // Enhanced error reporting with line numbers
        if (syntaxError instanceof SyntaxError) {
          const lines = code.split('\n');
          const errorLine = syntaxError.message.match(/line (\d+)/);
          if (errorLine) {
            const lineNum = parseInt(errorLine[1]);
            addOutput('error', `Syntax Error at line ${lineNum}: ${syntaxError.message}`);
            if (lines[lineNum - 1]) {
              addOutput('error', `> ${lineNum}: ${lines[lineNum - 1]}`);
            }
          } else {
            addOutput('error', `Syntax Error: ${syntaxError.message}`);
          }
        } else {
          addOutput('error', `Runtime Error: ${syntaxError.message}`);
        }
        throw syntaxError;
      }

      console.log = originalConsole;
      console.error = originalError;

      if (errors.length > 0) {
        errors.forEach(error => addOutput('error', error));
      }

      if (logs.length > 0) {
        logs.forEach(log => addOutput('output', log));
      }

      if (result !== undefined) {
        const resultStr = typeof result === 'object' 
          ? JSON.stringify(result, null, 2) 
          : String(result);
        addOutput('success', `→ ${resultStr}`);
      }
    } catch (error) {
      // Already handled above
    }
  };

  const runPython = async (code: string) => {
    try {
      addOutput('output', 'Loading Python environment...');
      
      // Dynamically import pyodide
      const { loadPyodide } = await import('pyodide');
      const pyodide = await loadPyodide();
      
      addOutput('success', 'Python environment ready!');
      
      // Capture print output
      const printBuffer: string[] = [];
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);
      
      // Run the Python code
      try {
        const result = pyodide.runPython(code);
        
        // Get captured output
        const stdout = pyodide.runPython('sys.stdout.getvalue()');
        const stderr = pyodide.runPython('sys.stderr.getvalue()');
        
        if (stdout) {
          addOutput('output', stdout);
        }
        if (stderr) {
          addOutput('error', stderr);
        }
        if (result !== undefined && result !== null) {
          addOutput('success', `→ ${result}`);
        }
      } catch (pythonError) {
        addOutput('error', `Python Error: ${pythonError.message}`);
      }
    } catch (error) {
      addOutput('error', `Failed to load Python: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showHelp = () => {
    const helpText = `
Available commands:
• js <code>        - Execute JavaScript code
• ts <code>        - Execute TypeScript code
• python <code>    - Execute Python code
• node <file>      - Run JavaScript file (like VS Code)
• touch <file>     - Create a new file
• cat <file>       - Display file contents
• echo <message>   - Print message
• clear            - Clear terminal
• cd <dir>         - Change directory
• ls               - List directory contents
• pwd              - Print working directory
• help             - Show this help
• kill | exit      - Close current terminal session

Examples:
• js console.log("Hello World!")
• python print("Hello from Python!")
• node script.js
• touch newfile.js
• cat index.html
• echo Hello from terminal
    `;
    addOutput('output', helpText.trim());
  };

  const clearTerminal = () => {
    setOutput([]);
  };

  const copyTerminalContent = () => {
    const content = output.map(item => {
      const timestamp = item.timestamp.toLocaleTimeString();
      return `[${timestamp}] ${item.content}`;
    }).join('\n');
    
    navigator.clipboard.writeText(content);
    addOutput('success', 'Terminal content copied to clipboard');
  };

  const downloadTerminalLog = () => {
    const content = output.map(item => {
      const timestamp = item.timestamp.toLocaleTimeString();
      return `[${timestamp}] [${item.type.toUpperCase()}] ${item.content}`;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-log-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // FS helpers
  const splitPath = (path: string) => path.split('/').filter(Boolean);
  const isDir = (path: string) => {
    const segments = splitPath(path);
    let nodes = getFileSystem ? getFileSystem() : [];
    if (segments.length === 0) return true;
    for (const seg of segments) {
      const next = nodes.find(n => n.type === 'folder' && n.name === seg);
      if (!next) return false;
      nodes = next.children || [];
    }
    return true;
  };
  const listDir = (path: string): string[] => {
    const segments = splitPath(path);
    let nodes = getFileSystem ? getFileSystem() : [];
    for (const seg of segments) {
      const next = nodes.find(n => n.type === 'folder' && n.name === seg);
      if (!next) return [];
      nodes = next.children || [];
    }
    return nodes.map(n => n.name + (n.type === 'folder' ? '/' : ''));
  };
  const resolvePath = (base: string, next: string) => {
    if (next.startsWith('/')) return next;
    const parts = [...splitPath(base), ...splitPath(next)];
    const stack: string[] = [];
    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') stack.pop();
      else stack.push(p);
    }
    return '/' + stack.join('/');
  };
  const getOutputIcon = (type: TerminalOutput['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-3 h-3 text-editor-error" />;
      case 'success':
        return <CheckCircle className="w-3 h-3 text-editor-success" />;
      case 'input':
        return <span className="text-editor-accent">$</span>;
      default:
        return <AlertCircle className="w-3 h-3 text-editor-text-muted" />;
    }
  };

  useImperativeHandle(ref, () => ({
    runJS: (code: string) => {
      addOutput('input', `$ Running JavaScript code...`);
      runJavaScript(code);
    },
    runTS: (code: string) => {
      addOutput('input', `$ Running TypeScript code...`);
      runJavaScript(code);
    },
    execute: executeCommand
  }));

  return (
    <div className="flex flex-col h-full bg-editor-bg">
      {/* Terminal Header - Only show if showHeader is true */}
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-editor-sidebar">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-4 h-4 text-editor-accent" />
            <span className="text-sm font-medium text-editor-text">{name}</span>
            <Badge variant="secondary" className="text-xs">
              {output.length} lines
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={copyTerminalContent}
              className="h-6 px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={downloadTerminalLog}
              className="h-6 px-2"
            >
              <Download className="w-3 h-3" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearTerminal}
              className="h-6 px-2"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            
            {onExit && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onExit}
                className="h-6 px-2"
              >
                <XCircle className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-auto p-3 bg-editor-bg font-mono text-sm scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
        style={{ userSelect: 'text', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
      >
        {output.map((item, index) => (
          <div key={item.id} className="mb-1 flex">
            <span className="text-editor-text-muted mr-2 text-xs leading-relaxed">
              {(index + 1).toString().padStart(3, '0')}
            </span>
            <div className={`whitespace-pre-wrap flex-1 ${
              item.type === 'input' ? 'text-editor-accent font-medium' :
              item.type === 'output' ? 'text-editor-text' :
              item.type === 'error' ? 'text-red-400' :
              item.type === 'success' ? 'text-green-400' :
              'text-editor-text-muted'
            }`}>
              {item.content}
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Input */}
      <div className="border-t border-border bg-editor-sidebar p-2">
        <div className="flex items-center gap-2">
          <span className="text-editor-text-muted text-xs font-mono">
            {cwd} $
          </span>
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isExecuting) {
                executeCommand();
              }
            }}
            placeholder="Enter command..."
            className="flex-1 bg-editor-panel border-editor-border font-mono text-sm h-8"
            disabled={isExecuting}
          />
          <Button
            onClick={executeCommand}
            disabled={isExecuting || !command.trim()}
            className="bg-editor-accent hover:bg-editor-accent-hover text-white h-8 px-3"
            size="sm"
          >
            <Play className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});