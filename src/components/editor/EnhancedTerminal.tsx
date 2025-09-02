import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Terminal as TerminalIcon, 
  X, 
  Minus, 
  Square, 
  RotateCcw,
  Copy,
  Download,
  Settings
} from 'lucide-react';

interface TerminalOutput {
  id: string;
  content: string;
  type: 'output' | 'error' | 'command';
  timestamp: Date;
}

interface EnhancedTerminalProps {
  title?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onClear?: () => void;
  onOutput?: (output: string, type: 'output' | 'error') => void;
  initialOutput?: TerminalOutput[];
}

export const EnhancedTerminal = ({ 
  title = "Terminal",
  onClose,
  onMinimize,
  onClear,
  onOutput,
  initialOutput = []
}: EnhancedTerminalProps) => {
  const [output, setOutput] = useState<TerminalOutput[]>(initialOutput);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lineNumber, setLineNumber] = useState(1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (onOutput) {
      const handleOutput = (content: string, type: 'output' | 'error') => {
        const newOutput: TerminalOutput = {
          id: Date.now().toString(),
          content,
          type,
          timestamp: new Date()
        };
        setOutput(prev => [...prev.slice(-99), newOutput]); // Keep only last 100 entries
        setLineNumber(prev => prev + 1);
      };

      // Store the function to call it
      (window as any).__terminalOutput = handleOutput;
    }
  }, [onOutput]);

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [output]);

  const executeCommand = () => {
    if (!command.trim()) return;

    // Add command to output
    const commandOutput: TerminalOutput = {
      id: Date.now().toString(),
      content: `$ ${command}`,
      type: 'command',
      timestamp: new Date()
    };

    setOutput(prev => [...prev, commandOutput]);
    setHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Simple command execution
    try {
      let result = '';
      const cmd = command.toLowerCase().trim();

      switch (cmd) {
        case 'clear':
          setOutput([]);
          setLineNumber(1);
          break;
        case 'help':
          result = `Available commands:
  clear    - Clear terminal
  help     - Show this help
  date     - Show current date
  echo     - Echo text
  pwd      - Show current directory
  ls       - List files (simulated)`;
          break;
        case 'date':
          result = new Date().toString();
          break;
        case 'pwd':
          result = '/workspace';
          break;
        case 'ls':
          result = `index.html  style.css  script.js  package.json  README.md`;
          break;
        default:
          if (cmd.startsWith('echo ')) {
            result = command.substring(5);
          } else {
            result = `Command not found: ${command}`;
          }
      }

      if (result) {
        const resultOutput: TerminalOutput = {
          id: (Date.now() + 1).toString(),
          content: result,
          type: 'output',
          timestamp: new Date()
        };
        setOutput(prev => [...prev, resultOutput]);
      }
    } catch (error) {
      const errorOutput: TerminalOutput = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error}`,
        type: 'error',
        timestamp: new Date()
      };
      setOutput(prev => [...prev, errorOutput]);
    }

    setCommand('');
    setLineNumber(prev => prev + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(history[newIndex]);
        }
      }
    }
  };

  const copyToClipboard = () => {
    const text = output.map(item => `${item.content}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const downloadLog = () => {
    const text = output.map(item => 
      `[${item.timestamp.toLocaleTimeString()}] ${item.type.toUpperCase()}: ${item.content}`
    ).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-log-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearTerminal = () => {
    setOutput([]);
    setLineNumber(1);
    onClear?.();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-green-400 font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4" />
          <span className="font-medium text-gray-300">{title}</span>
          <span className="text-xs text-gray-500">Line: {lineNumber}</span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500">{output.length} entries</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            title="Copy All Output"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadLog}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            title="Download Log"
          >
            <Download className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            title="Clear Terminal"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          {onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              title="Minimize"
            >
              <Minus className="w-3 h-3" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              title="Close Terminal"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Output */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
        <div className="space-y-1">
          {output.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              <TerminalIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Terminal ready. Type 'help' for available commands.</p>
            </div>
          )}
          
          {output.map((item, index) => (
            <div
              key={item.id}
              className={`flex ${
                item.type === 'command' 
                  ? 'text-cyan-400' 
                  : item.type === 'error' 
                  ? 'text-red-400' 
                  : 'text-green-400'
              }`}
            >
              <span className="text-gray-600 text-xs w-8 flex-shrink-0 text-right mr-2">
                {index + 1}
              </span>
              <div className="flex-1">
                <span className="text-xs text-gray-500 mr-2">
                  {item.timestamp.toLocaleTimeString()}
                </span>
                <span className="whitespace-pre-wrap break-words">
                  {item.content}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Command Input */}
      <div className="flex items-center gap-2 p-3 bg-gray-800 border-t border-gray-700">
        <span className="text-cyan-400">$</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          className="flex-1 bg-transparent outline-none text-green-400 placeholder-gray-500"
          autoFocus
        />
        <div className="text-xs text-gray-500">
          ↑↓ History | Enter to execute
        </div>
      </div>
    </div>
  );
};