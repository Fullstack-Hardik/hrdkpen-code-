import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  RefreshCw, 
  ExternalLink,
  Eye,
  EyeOff,
  Inspect,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';

interface LivePreviewProps {
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  activeFileName?: string;
}

export const LivePreview = ({ htmlContent, cssContent, jsContent, activeFileName }: LivePreviewProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState('');

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
        
        <script>
        // Enable dev tools inspection
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

  const openInspector = () => {
    const iframe = document.querySelector('iframe[title="Live Preview"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      // This opens the browser's dev tools for the iframe content
      console.log('Opening inspector for preview content');
      iframe.contentWindow.focus();
    }
  };

  const generateQRCode = async () => {
    try {
      const content = generatePreviewContent();
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQRCodeData(qrCodeDataUrl);
      setShowQRCode(true);
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  return (
    <div className="flex flex-col h-full editor-panel">
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-editor-accent" />
          {activeFileName && (
            <Badge variant="secondary" className="text-xs">
              {activeFileName}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
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
            onClick={generateQRCode}
            className="h-7 px-2"
            title="Generate QR Code"
          >
            <QrCode className="w-3 h-3" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={openInspector}
            className="h-7 px-2"
            title="Inspect"
          >
            <Inspect className="w-3 h-3" />
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
          <div className="w-full h-full border border-border rounded-lg overflow-hidden shadow-lg bg-white">
            <iframe
              key={refreshKey}
              srcDoc={generatePreviewContent()}
              className="w-full h-full"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
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

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">QR Code for Preview</h3>
              <p className="text-sm text-gray-600">Scan to download and open file</p>
            </div>
            {qrCodeData && (
              <img src={qrCodeData} alt="QR Code" className="mx-auto mb-4" />
            )}
            <Button onClick={() => setShowQRCode(false)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};