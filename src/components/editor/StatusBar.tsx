import { useState, useEffect } from 'react';
import { 
  GitBranch, 
  AlertCircle, 
  AlertTriangle, 
  Code, 
  FileText,
  Activity,
  Zap,
  Database
} from 'lucide-react';

interface StatusBarProps {
  activeFile?: { name: string; language?: string };
  cursorPosition?: { line: number; column: number };
  totalLines?: number;
  errors?: number;
  errorLines?: number[];
  warnings?: number;
  onHostClick?: () => void;
}

export const StatusBar = ({ 
  activeFile,
  cursorPosition = { line: 1, column: 1 },
  totalLines = 0,
  errors = 0,
  errorLines = [],
  warnings = 0,
  onHostClick
}: StatusBarProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-7 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-t border-purple-500/30 flex items-center justify-between px-3 text-xs text-purple-300/90 backdrop-blur-sm flex-shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.open('https://getlivenow.lovable.app', '_blank')}
          className="flex items-center gap-1.5 hover:text-purple-200 transition-colors px-2 py-0.5 rounded hover:bg-purple-500/20 cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="font-medium">getlivenow.lovable.app</span>
        </button>

        <div className="flex items-center gap-1.5 text-purple-300/70">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
        </div>

        {/* Errors & Warnings with line numbers */}
        <div className="flex items-center gap-3">
          {errors > 0 ? (
            <button 
              className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
              title={`Errors on lines: ${errorLines.join(', ')}`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="font-medium">
                {errors} error{errors > 1 ? 's' : ''} 
                {errorLines.length > 0 && ` (Ln ${errorLines.slice(0, 3).join(', ')}${errorLines.length > 3 ? '...' : ''})`}
              </span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-green-400/70">
              <AlertCircle className="w-3 h-3" />
              <span>0 errors</span>
            </span>
          )}
          {warnings > 0 && (
            <button
              className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-medium">{warnings} warning{warnings > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-4 text-purple-300/70">
        {activeFile && (
          <>
            <div className="flex items-center gap-1.5">
              <Code className="w-3 h-3" />
              <span>{activeFile.language || 'plaintext'}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
            </div>

            {totalLines > 0 && (
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                <span>{totalLines} lines</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-green-400">
          <Zap className="w-3 h-3" />
          <span>Ready</span>
        </div>
        
        <div className="text-purple-300/70">
          {time.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
