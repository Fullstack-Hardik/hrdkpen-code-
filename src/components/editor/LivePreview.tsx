import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Laptop, 
  RefreshCw, 
  ExternalLink,
  Eye,
  EyeOff,
  Terminal
} from 'lucide-react';

interface LivePreviewProps {
  htmlContent: string;
  cssContent: string;
  jsContent: string;
}

type ViewportSize = 'desktop' | 'laptop' | 'tablet' | 'mobile';

const viewportSizes = {
  desktop: { width: '100%', height: '100%', icon: Monitor, label: 'Desktop' },
  laptop: { width: '1024px', height: '768px', icon: Laptop, label: 'Laptop' },
  tablet: { width: '768px', height: '1024px', icon: Tablet, label: 'Tablet' },
  mobile: { width: '375px', height: '667px', icon: Smartphone, label: 'Mobile' }
};

export const LivePreview = ({ htmlContent, cssContent, jsContent }: LivePreviewProps) => {
  const [currentViewport, setCurrentViewport] = useState<ViewportSize>('desktop');
  const [isVisible, setIsVisible] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const generatePreviewContent = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Preview</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #ffffff;
            color: #333333;
        }
        .console-output {
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: #1a1a1a;
          color: #fff;
          padding: 10px;
          border-radius: 6px;
          max-width: 300px;
          max-height: 200px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 12px;
          display: none;
          z-index: 1000;
        }
        .console-toggle {
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: #007acc;
          color: white;
          border: none;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          z-index: 1001;
        }
        ${cssContent}
    </style>
</head>
<body>
    ${htmlContent}
    
    <button class="console-toggle" onclick="toggleConsole()">Console</button>
    <div id="console-output" class="console-output"></div>
    
    <script>
        let consoleOutput = [];
        const originalConsole = {
          log: console.log,
          error: console.error,
          warn: console.warn
        };
        
        function addToConsole(type, ...args) {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          consoleOutput.push({ type, message, time: new Date().toLocaleTimeString() });
          updateConsoleDisplay();
        }
        
        function updateConsoleDisplay() {
          const consoleDiv = document.getElementById('console-output');
          consoleDiv.innerHTML = consoleOutput.map(entry => 
            '<div style="color: ' + (entry.type === 'error' ? '#ff6b6b' : entry.type === 'warn' ? '#ffd93d' : '#4ecdc4') + '">' +
            '[' + entry.time + '] ' + entry.message + '</div>'
          ).join('');
          consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
        
        function toggleConsole() {
          const consoleDiv = document.getElementById('console-output');
          consoleDiv.style.display = consoleDiv.style.display === 'none' ? 'block' : 'none';
        }
        
        console.log = (...args) => {
          originalConsole.log(...args);
          addToConsole('log', ...args);
        };
        
        console.error = (...args) => {
          originalConsole.error(...args);
          addToConsole('error', ...args);
        };
        
        console.warn = (...args) => {
          originalConsole.warn(...args);
          addToConsole('warn', ...args);
        };
        
        window.onerror = function(msg, url, line, col, error) {
          addToConsole('error', 'Error at line ' + line + ': ' + msg);
          return false;
        };
        
        try {
            ${jsContent}
        } catch (error) {
            console.error('JavaScript Error:', error.message);
        }
    </script>
</body>
</html>
    `;
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const openInNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(generatePreviewContent());
      newWindow.document.close();
    }
  };

  const viewport = viewportSizes[currentViewport];
  const IconComponent = viewport.icon;

  return (
    <div className="flex flex-col h-full editor-panel">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-editor-accent" />
          <span className="text-sm font-medium text-editor-text">Live Preview</span>
          <Badge variant="secondary" className="text-xs">
            {viewport.label}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Viewport Selector */}
          <div className="flex items-center gap-1">
            {Object.entries(viewportSizes).map(([size, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={size}
                  variant={currentViewport === size ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentViewport(size as ViewportSize)}
                  className="h-7 w-8 p-0"
                >
              <Icon 
                className={`w-3 h-3 ${currentViewport === size ? 'text-white' : ''}`} 
              />
            </Button>
          );
        })}
      </div>
      
      <div className="w-px h-4 bg-border" />
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="h-7 px-2"
        title="Toggle Visibility"
      >
        {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleRefresh}
        className="h-7 px-2"
        title="Refresh"
      >
        <RefreshCw className="w-3 h-3" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={openInNewTab}
        className="h-7 px-2"
        title="Open in New Tab"
      >
        <ExternalLink className="w-3 h-3" />
      </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto" style={{ userSelect: 'text' }}>
        {isVisible ? (
          <div 
            className="border border-border rounded-lg overflow-hidden shadow-lg bg-white transition-all duration-300"
            style={{ 
              width: currentViewport === 'desktop' ? '100%' : viewport.width, 
              height: currentViewport === 'desktop' ? '100%' : viewport.height,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <iframe
              key={refreshKey}
              srcDoc={generatePreviewContent()}
              className="w-full h-full"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin allow-popups"
              style={{ userSelect: 'text' }}
            />
          </div>
        ) : (
          <div className="text-center text-editor-text-muted">
            <EyeOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Preview hidden</p>
          </div>
        )}
      </div>
    </div>
  );
};