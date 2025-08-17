import { useState, useRef, useEffect } from 'react';
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

interface TerminalOutput {
  id: string;
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
  timestamp: Date;
}

interface TerminalProps {
  onExecuteCode?: (code: string, language: string) => void;
}

export const Terminal = ({ onExecuteCode }: TerminalProps) => {
  const [output, setOutput] = useState<TerminalOutput[]>([
    {
      id: '1',
      type: 'success',
      content: 'Smart Code Editor Terminal v1.0.0 - Ready!',
      timestamp: new Date()
    }
  ]);
  const [command, setCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new output is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const addOutput = (type: TerminalOutput['type'], content: string) => {
    const newOutput: TerminalOutput = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setOutput(prev => [...prev, newOutput]);
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    setIsExecuting(true);
    addOutput('input', `$ ${command}`);

    // Handle different command types
    try {
      if (command.startsWith('js ') || command.startsWith('javascript ')) {
        // Execute JavaScript
        const code = command.replace(/^(js|javascript)\s+/, '');
        executeJavaScript(code);
      } else if (command.startsWith('ts ') || command.startsWith('typescript ')) {
        // Execute TypeScript (simplified - would need proper compilation)
        const code = command.replace(/^(ts|typescript)\s+/, '');
        executeJavaScript(code); // For now, treat as JS
      } else if (command === 'clear') {
        setOutput([]);
      } else if (command === 'help') {
        showHelp();
      } else if (command.startsWith('echo ')) {
        const message = command.replace('echo ', '');
        addOutput('output', message);
      } else {
        // Try to execute as JavaScript by default
        executeJavaScript(command);
      }
    } catch (error) {
      addOutput('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setCommand('');
    setIsExecuting(false);
  };

  const executeJavaScript = (code: string) => {
    try {
      // Create a safe execution context
      const originalConsole = console.log;
      const logs: string[] = [];
      
      // Override console.log to capture output
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };

      // Execute the code
      const result = eval(code);
      
      // Restore console.log
      console.log = originalConsole;
      
      // Show captured logs
      if (logs.length > 0) {
        logs.forEach(log => addOutput('output', log));
      }
      
      // Show result if it's not undefined
      if (result !== undefined) {
        const resultStr = typeof result === 'object' 
          ? JSON.stringify(result, null, 2) 
          : String(result);
        addOutput('success', resultStr);
      }
    } catch (error) {
      addOutput('error', `JavaScript Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showHelp = () => {
    const helpText = `
Available commands:
• js <code>        - Execute JavaScript code
• ts <code>        - Execute TypeScript code
• echo <message>   - Print message
• clear            - Clear terminal
• help             - Show this help

Examples:
• js console.log("Hello World!")
• js Math.random()
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

  return (
    <div className="flex flex-col h-full editor-panel">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-editor-accent" />
          <span className="text-sm font-medium text-editor-text">Terminal</span>
          <Badge variant="secondary" className="text-xs">
            {output.length} lines
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={copyTerminalContent}
            className="h-7 px-2"
          >
            <Copy className="w-3 h-3" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={downloadTerminalLog}
            className="h-7 px-2"
          >
            <Download className="w-3 h-3" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearTerminal}
            className="h-7 px-2"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm bg-editor-bg"
      >
        {output.map((item) => (
          <div key={item.id} className="flex items-start gap-2 mb-1">
            {getOutputIcon(item.type)}
            <span 
              className={`flex-1 whitespace-pre-wrap ${
                item.type === 'error' ? 'text-editor-error' :
                item.type === 'success' ? 'text-editor-success' :
                item.type === 'input' ? 'text-editor-accent' :
                'text-editor-text'
              }`}
            >
              {item.content}
            </span>
            <span className="text-xs text-editor-text-dim">
              {item.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {/* Command Input */}
      <div className="flex items-center gap-2 p-4 border-t border-border">
        <span className="text-editor-accent font-mono">$</span>
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              executeCommand();
            }
          }}
          placeholder="Enter command... (try 'help' for available commands)"
          className="flex-1 font-mono bg-editor-panel border-editor-border focus:border-editor-accent"
          disabled={isExecuting}
        />
        <Button 
          onClick={executeCommand}
          disabled={isExecuting || !command.trim()}
          size="sm"
          className="h-8"
        >
          {isExecuting ? (
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );
};