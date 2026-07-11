import React, { useState, useEffect } from 'react';
import { Search, Download, Copy, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY || '44960484-fee9decec027c63657796ef2e';

interface PixabayImage {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
}

export const AssetLibrary: React.FC = () => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<PixabayImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async (searchQuery: string = 'developer coding') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(searchQuery)}&image_type=photo&per_page=20`
      );
      if (!res.ok) throw new Error('Failed to fetch images');
      const data = await res.json();
      setImages(data.hits);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) fetchImages(query.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could trigger a toast here
  };

  const downloadImage = async (url: string, id: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `asset-${id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
      // Fallback
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-editor-bg overflow-hidden">
      <div className="p-4 border-b border-editor-border bg-editor-panel">
        <h2 className="text-sm font-semibold text-editor-text flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4 text-indigo-400" /> Developer Assets
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-editor-text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets (e.g., coding, nature)..."
              className="pl-9 h-8 bg-editor-bg border-editor-border text-xs focus-visible:ring-indigo-500/50"
            />
          </div>
          <Button type="submit" size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white">
            Search
          </Button>
        </form>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {['Technology', 'Coding', 'UI Design', 'Nature', 'Business'].map(cat => (
            <button
              key={cat}
              onClick={() => { setQuery(cat); fetchImages(cat); }}
              className="px-2.5 py-1 rounded-full bg-editor-border/50 text-[10px] text-editor-text-muted hover:text-editor-text hover:bg-editor-border transition-colors whitespace-nowrap"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-editor-text-muted">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs">Loading assets...</span>
          </div>
        ) : error ? (
          <div className="text-center text-editor-error text-xs p-4">{error}</div>
        ) : images.length === 0 ? (
          <div className="text-center text-editor-text-muted text-xs p-4">No assets found.</div>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {images.map(img => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border border-editor-border/50 break-inside-avoid shadow-sm hover:shadow-indigo-500/10 transition-shadow">
                <img 
                  src={img.webformatURL} 
                  alt={img.tags}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Load+Error';
                  }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                  <button 
                    onClick={() => copyToClipboard(img.largeImageURL)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-editor-panel/90 rounded text-[10px] font-medium text-white hover:bg-indigo-600 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy URL
                  </button>
                  <button 
                    onClick={() => downloadImage(img.largeImageURL, img.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-editor-panel/90 rounded text-[10px] font-medium text-white hover:bg-emerald-600 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
