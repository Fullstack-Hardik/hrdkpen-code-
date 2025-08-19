import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Move, RotateCcw, Maximize, Minimize } from 'lucide-react';

interface YouTubePlayerProps {
  url: string;
  onClose: () => void;
}

export const YouTubePlayer = ({ url, onClose }: YouTubePlayerProps) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 560, height: 315 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const getVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const videoId = getVideoId(url);

  if (!videoId) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-red-500 mb-4">Invalid YouTube URL</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={containerRef}
        className={`absolute bg-black rounded-lg shadow-2xl pointer-events-auto ${
          isMaximized ? 'inset-4' : ''
        }`}
        style={
          isMaximized
            ? {}
            : {
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height + 40
              }
        }
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-2 bg-gray-800 rounded-t-lg cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-white" />
            <span className="text-white text-sm">YouTube Player</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMaximize}
              className="text-white hover:bg-gray-700 h-6 w-6 p-0"
            >
              {isMaximized ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-red-600 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Video */}
        <iframe
          width={isMaximized ? '100%' : size.width}
          height={isMaximized ? 'calc(100% - 40px)' : size.height}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="rounded-b-lg"
        />

        {/* Resize Handle */}
        {!isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-gray-600 cursor-se-resize"
            onMouseDown={(e) => {
              setIsResizing(true);
              setDragStart({
                x: e.clientX - size.width,
                y: e.clientY - size.height
              });
            }}
          />
        )}
      </div>
    </div>
  );
};