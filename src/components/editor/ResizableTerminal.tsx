import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal, Maximize2, Minimize2, X, RotateCcw } from 'lucide-react';

interface ResizableTerminalProps {
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
  onClear?: () => void;
  className?: string;
}

export const ResizableTerminal = ({ 
  children, 
  title = "Terminal", 
  onClose, 
  onClear,
  className 
}: ResizableTerminalProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [height, setHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    startY.current = e.clientY;
    startHeight.current = height;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaY = startY.current - e.clientY;
    const newHeight = Math.max(200, Math.min(800, startHeight.current + deltaY));
    setHeight(newHeight);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <Card 
      ref={terminalRef}
      className={`
        ${className}
        ${isMaximized ? 'fixed inset-4 z-50' : 'relative'}
        bg-editor-panel border-editor-border overflow-hidden
        transition-all duration-200
      `}
      style={!isMaximized ? { height: `${height}px` } : {}}
    >
      {/* Resize Handle */}
      {!isMaximized && (
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-editor-border hover:bg-editor-accent cursor-ns-resize transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-editor-header border-b border-editor-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-editor-accent" />
          <span className="text-sm font-medium text-editor-text">{title}</span>
          <Badge variant="outline" className="text-xs">
            {isMaximized ? 'Maximized' : `${height}px`}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 w-6 p-0 text-editor-text-muted hover:text-editor-text"
              title="Clear Terminal"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMaximize}
            className="h-6 w-6 p-0 text-editor-text-muted hover:text-editor-text"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-editor-text-muted hover:text-red-400"
              title="Close Terminal"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Status Line */}
      <div className="px-3 py-1 bg-editor-bg border-t border-editor-border text-xs text-editor-text-dim">
        <div className="flex items-center justify-between">
          <span>Ready</span>
          <span>
            Lines: 1000 | Cols: 80 | {isResizing ? 'Resizing...' : 'Ready'}
          </span>
        </div>
      </div>
    </Card>
  );
};