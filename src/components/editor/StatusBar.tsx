import { useState, useEffect } from 'react';
import { 
  GitBranch, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
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
  warnings?: number;
  onHostClick?: () => void;
}

export const StatusBar = ({ 
  activeFile,
  cursorPosition = { line: 1, column: 1 },
  totalLines = 0,
  errors = 0,
  warnings = 0,
  onHostClick
}: StatusBarProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-6 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-t border-purple-500/30 flex items-center justify-between px-3 text-xs text-purple-300/90 backdrop-blur-sm">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Host Button */}
        <button
          onClick={onHostClick}
          className="flex items-center gap-1.5 hover:text-purple-300 transition-colors px-2 py-0.5 rounded hover:bg-purple-500/20"
        >
          <Activity className="w-3 h-3" />
          <span className="font-medium">getlivenow.lovable.app</span>
        </button>

        {/* Git Branch */}
        <div className="flex items-center gap-1.5 text-purple-300/70">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
        </div>

        {/* Errors & Warnings */}
        {(errors > 0 || warnings > 0) && (
          <div className="flex items-center gap-3">
            {errors > 0 && (
              <div className="flex items-center gap-1 text-red-400">
                <AlertCircle className="w-3 h-3" />
                <span>{errors}</span>
              </div>
            )}
            {warnings > 0 && (
              <div className="flex items-center gap-1 text-yellow-400">
                <AlertTriangle className="w-3 h-3" />
                <span>{warnings}</span>
              </div>
            )}
          </div>
        )}
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
