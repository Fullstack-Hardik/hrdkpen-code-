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
  EyeOff
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
        ${cssContent}
    </style>
</head>
<body>
    ${htmlContent}
    <script>
        try {
            ${jsContent}
        } catch (error) {
            console.error('JavaScript Error:', error);
            document.body.innerHTML += '<div style="background: #ffebee; color: #c62828; padding: 10px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #c62828;"><strong>JavaScript Error:</strong> ' + error.message + '</div>';
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
                  <Icon className="w-3 h-3" />
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
          >
            {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            className="h-7 px-2"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={openInNewTab}
            className="h-7 px-2"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {isVisible ? (
          <div 
            className="border border-border rounded-lg overflow-hidden shadow-lg bg-white"
            style={{ 
              width: viewport.width, 
              height: viewport.height,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <iframe
              key={refreshKey}
              srcDoc={generatePreviewContent()}
              className="w-full h-full"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin"
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