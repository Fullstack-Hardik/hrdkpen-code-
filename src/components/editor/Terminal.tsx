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
  XCircle,
  X
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
  runPython: (code: string) => void;
  runJava: (code: string) => void;
  runC: (code: string, lang: string) => void;
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
      } else if (command === 'npm init' || command === 'npm init -y') {
        addOutput('output', '📦 Initializing new npm project...');
        setTimeout(() => {
          addOutput('success', '✅ Created package.json');
          onCreateFile?.('package.json');
          addOutput('output', 'Project initialized successfully!');
        }, 500);
      } else if (command.startsWith('npm install') || command.startsWith('npm i ')) {
        const packageName = command.replace(/npm (install|i)\s+/, '').trim();
        if (packageName) {
          addOutput('output', `📦 Installing ${packageName}...`);
          setTimeout(() => {
            addOutput('success', `✅ ${packageName}@latest installed successfully`);
            addOutput('output', `Added ${packageName} to dependencies`);
            addOutput('output', `Run 'npm list' to see all installed packages`);
          }, 1500);
        } else {
          addOutput('error', 'Please specify a package name');
        }
      } else if (command === 'npm list' || command === 'npm ls') {
        addOutput('output', '📦 Installed packages:');
        addOutput('output', '├── react@18.2.0');
        addOutput('output', '├── typescript@5.0.0');
        addOutput('output', '├── vite@4.3.0');
        addOutput('output', '└── express@4.18.0');
      } else if (command.startsWith('mkdir ')) {
        const dirName = command.replace('mkdir ', '').trim();
        addOutput('success', `Created directory: ${dirName}`);
        onCreateFile?.(`${dirName}/.gitkeep`);
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
      
      // Dynamically import pyodide with proper error handling
      try {
        const { loadPyodide } = await import('pyodide');
        const pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/"
        });
        
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
          addOutput('error', `Python Error: ${pythonError.message || pythonError}`);
        }
      } catch (loadError) {
        addOutput('error', `Failed to load Python environment: ${loadError.message || loadError}`);
        addOutput('error', 'Python support requires a modern browser with WebAssembly support.');
      }
    } catch (error) {
      addOutput('error', `Critical Python Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addOutput('error', 'Try refreshing the page or use a different browser.');
    }
  };

  // Java interpreter - transpile simple Java to JS and run
  const runJava = (code: string) => {
    try {
      addOutput('output', '☕ Compiling Java...');
      
      // Simple Java-to-JS transpiler for basic programs
      let jsCode = code;
      
      // Extract main method body
      const mainMatch = code.match(/public\s+static\s+void\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}/);
      if (mainMatch) {
        jsCode = mainMatch[1];
      }
      
      // Convert System.out.println → console.log
      jsCode = jsCode.replace(/System\.out\.println\s*\(/g, 'console.log(');
      jsCode = jsCode.replace(/System\.out\.print\s*\(/g, 'process.stdout.write(');
      // Convert System.err.println → console.error
      jsCode = jsCode.replace(/System\.err\.println\s*\(/g, 'console.error(');
      
      // Handle basic Java types → JS
      jsCode = jsCode.replace(/\b(int|double|float|long|short|byte|char|boolean)\s+/g, 'let ');
      jsCode = jsCode.replace(/\bString\s+/g, 'let ');
      jsCode = jsCode.replace(/\bString\[\]\s+/g, 'let ');
      jsCode = jsCode.replace(/\bfinal\s+/g, 'const ');
      
      // Handle Scanner input simulation
      jsCode = jsCode.replace(/Scanner\s+\w+\s*=\s*new\s+Scanner\s*\([^)]*\)\s*;/g, '');
      jsCode = jsCode.replace(/\w+\.nextLine\(\)/g, '"sample input"');
      jsCode = jsCode.replace(/\w+\.nextInt\(\)/g, '42');
      jsCode = jsCode.replace(/\w+\.nextDouble\(\)/g, '3.14');
      
      // Handle basic array creation
      jsCode = jsCode.replace(/new\s+int\s*\[(\d+)\]/g, 'new Array($1).fill(0)');
      jsCode = jsCode.replace(/new\s+String\s*\[(\d+)\]/g, 'new Array($1).fill("")');
      
      // Handle Math methods (they're the same in JS)
      // Handle string methods
      jsCode = jsCode.replace(/\.length\(\)/g, '.length');
      jsCode = jsCode.replace(/\.equals\(/g, ' === (');
      
      addOutput('success', '✅ Java compiled successfully');
      runJavaScript(jsCode);
    } catch (error: any) {
      addOutput('error', `Java Error: ${error.message || error}`);
    }
  };

  // C interpreter - transpile simple C to JS and run
  const runC = (code: string, lang: string) => {
    try {
      addOutput('output', `🔧 Compiling ${lang === 'cpp' ? 'C++' : 'C'} code...`);
      
      let jsCode = code;
      
      // Remove includes
      jsCode = jsCode.replace(/#include\s*<[^>]+>/g, '');
      jsCode = jsCode.replace(/#include\s*"[^"]+"/g, '');
      jsCode = jsCode.replace(/#define\s+(\w+)\s+(.+)/g, 'const $1 = $2;');
      
      // Extract main function body
      const mainMatch = jsCode.match(/int\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}/);
      if (mainMatch) {
        jsCode = mainMatch[1];
      }
      
      // Convert printf → console.log with format string handling
      jsCode = jsCode.replace(/printf\s*\(\s*"([^"]*)"(?:\s*,\s*([^)]+))?\s*\)/g, (match, fmt, args) => {
        if (!args) return `console.log("${fmt}")`;
        const argList = args.split(',').map((a: string) => a.trim());
        let result = fmt;
        let argIdx = 0;
        result = result.replace(/%[dif]/g, () => `\${${argList[argIdx++] || '""'}}`);
        result = result.replace(/%s/g, () => `\${${argList[argIdx++] || '""'}}`);
        result = result.replace(/%c/g, () => `\${String.fromCharCode(${argList[argIdx++] || '0'})}`);
        return `console.log(\`${result}\`)`;
      });
      
      // Convert cout
      jsCode = jsCode.replace(/std::cout\s*<<\s*/g, 'console.log(');
      jsCode = jsCode.replace(/\s*<<\s*std::endl/g, ')');
      jsCode = jsCode.replace(/\s*<<\s*"\\n"/g, ')');
      jsCode = jsCode.replace(/cout\s*<<\s*/g, 'console.log(');
      
      // Convert scanf → simulated input
      jsCode = jsCode.replace(/scanf\s*\([^)]+\)/g, '/* input simulated */');
      jsCode = jsCode.replace(/cin\s*>>\s*(\w+)/g, 'let $1 = 42');
      
      // Handle C types
      jsCode = jsCode.replace(/\b(int|float|double|long|short|char|unsigned)\s+/g, 'let ');
      jsCode = jsCode.replace(/\bconst\s+char\s*\*\s*/g, 'const ');
      jsCode = jsCode.replace(/\bchar\s*\*\s*/g, 'let ');
      jsCode = jsCode.replace(/\bvoid\s+(\w+)\s*\(/g, 'function $1(');
      
      // Remove return 0
      jsCode = jsCode.replace(/return\s+0\s*;/g, '');
      
      // Handle string methods
      jsCode = jsCode.replace(/strlen\((\w+)\)/g, '$1.length');
      jsCode = jsCode.replace(/strcmp\(([^,]+),\s*([^)]+)\)/g, '($1 === $2 ? 0 : -1)');
      
      addOutput('success', `✅ ${lang === 'cpp' ? 'C++' : 'C'} compiled successfully`);
      runJavaScript(jsCode);
    } catch (error: any) {
      addOutput('error', `${lang === 'cpp' ? 'C++' : 'C'} Error: ${error.message || error}`);
    }
  };

  const showHelp = () => {
    const helpText = `
Available commands:
• js <code>        - Execute JavaScript code
• ts <code>        - Execute TypeScript code
• python <code>    - Execute Python code
• node <file>      - Run JavaScript file (like VS Code)
• npm init         - Initialize npm project
• npm install <pkg> - Install npm package
• npm list         - List installed packages
• touch <file>     - Create a new file
• mkdir <dir>      - Create a new directory
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
• node server.js
• npm install express
• npm init -y
• touch newfile.js
• mkdir src
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
    runPython: (code: string) => {
      addOutput('input', `$ Running Python code...`);
      runPython(code);
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
              Lines: {output.length}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {cwd}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Status: {isExecuting ? 'Running' : 'Ready'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={copyTerminalContent}
              className="h-6 px-2"
              title="Copy Terminal Content"
            >
              <Copy className="w-3 h-3" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={downloadTerminalLog}
              className="h-6 px-2"
              title="Download Log"
            >
              <Download className="w-3 h-3" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearTerminal}
              className="h-6 px-2"
              title="Clear Terminal"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            
            {onExit && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onExit}
                className="h-6 px-2"
                title="Close Terminal"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 bg-editor-bg font-mono text-sm scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 select-text"
        style={{ 
          userSelect: 'text', 
          whiteSpace: 'pre-wrap', 
          overflowWrap: 'break-word',
          maxHeight: output.length > 4 ? '400px' : 'auto',
          scrollBehavior: 'smooth'
        }}
      >
        {output.map((item, index) => (
          <div key={item.id} className="mb-1 flex hover:bg-editor-panel/20 rounded px-1 group">
            <span className="text-editor-text-muted mr-2 text-xs leading-relaxed select-none">
              {(index + 1).toString().padStart(3, '0')}
            </span>
            <div className={`whitespace-pre-wrap flex-1 select-text ${
              item.type === 'input' ? 'text-editor-accent font-medium' :
              item.type === 'output' ? 'text-editor-text' :
              item.type === 'error' ? 'text-red-400' :
              item.type === 'success' ? 'text-green-400' :
              'text-editor-text-muted'
            }`}>
              {item.content}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(item.content)}
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-editor-accent/20 rounded transition-opacity"
              title="Copy line"
            >
              <Copy className="w-3 h-3" />
            </button>
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