import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  RefreshCw, 
  ExternalLink,
  Eye,
  EyeOff,
  QrCode,
  Smartphone,
  Tablet,
  Laptop,
  Download
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';

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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Auto-refresh when content changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500); // Debounce updates
    
    return () => clearTimeout(timeoutId);
  }, [htmlContent, cssContent, jsContent]);

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

  const downloadFile = async () => {
    try {
      const content = generatePreviewContent();
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeFileName || 'preview.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const generateQRCode = async () => {
    try {
      const content = generatePreviewContent();
      const fileName = activeFileName || 'preview.html';
      
      // Create blob and download URL
      const blob = new Blob([content], { type: 'text/html' });
      const downloadUrl = URL.createObjectURL(blob);
      
      // Create a simple HTML page that will download the file
      const downloadPageContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Download ${fileName}</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f5f5f5;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .download-btn { 
              background: #007bff; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block; 
              margin: 20px 0;
              font-weight: 500;
              transition: background 0.2s;
            }
            .download-btn:hover {
              background: #0056b3;
            }
            .file-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #007bff;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📁 File Ready for Download</h1>
            <div class="file-info">
              <strong>File:</strong> ${fileName}<br>
              <strong>Size:</strong> ${Math.round(blob.size / 1024)} KB<br>
              <strong>Type:</strong> HTML Document
            </div>
            <p>Your file is ready! Click the button below to download:</p>
            <a href="${downloadUrl}" download="${fileName}" class="download-btn">
              ⬇️ Download ${fileName}
            </a>
            <p><small>The download will start automatically in 3 seconds...</small></p>
          </div>
          <script>
            // Auto download after 3 seconds
            setTimeout(() => {
              const link = document.createElement('a');
              link.href = '${downloadUrl}';
              link.download = '${fileName}';
              link.click();
            }, 3000);
          </script>
        </body>
        </html>
      `;
      
      const pageBlob = new Blob([downloadPageContent], { type: 'text/html' });
      const pageUrl = URL.createObjectURL(pageBlob);
      
      // Generate QR code for the download page
      const qrCodeDataUrl = await QRCode.toDataURL(pageUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQRCodeData(qrCodeDataUrl);
      setShowQRCode(true);
      
      // Immediately download the file as well
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up URLs after 30 seconds
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
        URL.revokeObjectURL(pageUrl);
      }, 30000);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
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
          {/* Device Preview Modes */}
          <div className="flex items-center gap-1 border border-border rounded">
            <Button 
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
              className="h-6 px-2"
              title="Desktop View"
            >
              <Laptop className="w-3 h-3" />
            </Button>
            <Button 
              variant={previewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
              className="h-6 px-2"
              title="Tablet View"
            >
              <Tablet className="w-3 h-3" />
            </Button>
            <Button 
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
              className="h-6 px-2"
              title="Mobile View"
            >
              <Smartphone className="w-3 h-3" />
            </Button>
          </div>
          
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
            onClick={downloadFile}
            className="h-7 px-2"
            title="Download File"
          >
            <Download className="w-3 h-3" />
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
          (htmlContent.trim() || cssContent.trim() || jsContent.trim()) ? (
            <div 
              className="border border-border rounded-lg overflow-hidden shadow-lg bg-white mx-auto"
              style={{
                ...getPreviewDimensions(),
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            >
              <iframe
                key={refreshKey}
                srcDoc={generatePreviewContent()}
                className="w-full h-full"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
                style={{ userSelect: 'text' }}
                onLoad={(e) => {
                  const iframe = e.target as HTMLIFrameElement;
                  if (iframe.contentDocument) {
                    const title = iframe.contentDocument.title || activeFileName || 'Preview';
                    // Update browser tab title
                    document.title = `${title} - HardkPen Code Editor`;
                    
                    // Override link clicks to prevent navigation
                    iframe.contentDocument.addEventListener('click', (event) => {
                      const target = event.target as HTMLElement;
                      if (target.tagName === 'A') {
                        event.preventDefault();
                        const href = (target as HTMLAnchorElement).href;
                        if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
                          window.open(href, '_blank');
                        }
                      }
                    });
                  }
                }}
              />
            </div>
          ) : (
            <div className="text-center text-editor-text-muted max-w-md">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
                <span className="text-4xl">💻</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Start Coding</h3>
              <p className="text-sm mb-4">Create a new file or write some code to see the live preview</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• HTML for structure</p>
                <p>• CSS for styling</p> 
                <p>• JavaScript for interactivity</p>
              </div>
            </div>
          )
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
              <h3 className="text-lg font-semibold">Scan to Download</h3>
              <p className="text-sm text-gray-600">File will download automatically when scanned</p>
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