import { useState } from 'react';
import { Search, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
}

interface SearchResult {
  fileId: string;
  fileName: string;
  line: number;
  content: string;
  match: string;
}

interface FindInFilesProps {
  files: FileNode[];
  onResultClick: (fileId: string, line: number) => void;
  onClose: () => void;
}

export const FindInFiles = ({ files, onResultClick, onClose }: FindInFilesProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const searchInFiles = (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const searchPattern = caseSensitive ? term : term.toLowerCase();

    const searchFile = (file: FileNode) => {
      if (file.type === 'file' && file.content) {
        const lines = file.content.split('\n');
        lines.forEach((line, index) => {
          const searchLine = caseSensitive ? line : line.toLowerCase();
          if (searchLine.includes(searchPattern)) {
            searchResults.push({
              fileId: file.id,
              fileName: file.name,
              line: index + 1,
              content: line.trim(),
              match: term
            });
          }
        });
      }
      if (file.children) {
        file.children.forEach(searchFile);
      }
    };

    files.forEach(searchFile);
    setResults(searchResults);
    
    // Auto-expand all files with results
    const fileIds = new Set(searchResults.map(r => r.fileId));
    setExpandedFiles(fileIds);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    searchInFiles(value);
  };

  const toggleFileExpanded = (fileId: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.fileId]) {
      acc[result.fileId] = [];
    }
    acc[result.fileId].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="flex flex-col h-full bg-editor-panel border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-editor-sidebar">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-editor-accent" />
          <span className="text-sm font-medium text-editor-text">Find in Files</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-editor-text-muted hover:text-editor-text"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-editor-text-muted" />
          <Input
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search in files..."
            className="pl-9 bg-editor-panel border-editor-border text-editor-text"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-editor-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => {
                setCaseSensitive(e.target.checked);
                searchInFiles(searchTerm);
              }}
              className="w-3 h-3"
            />
            Match case
          </label>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        {results.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="w-12 h-12 mx-auto mb-3 text-editor-text-muted opacity-50" />
            <p className="text-sm text-editor-text-muted">
              {searchTerm ? 'No results found' : 'Enter search term to find in files'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            <div className="mb-2 px-2 text-xs text-editor-text-muted">
              {results.length} result{results.length !== 1 ? 's' : ''} in {Object.keys(groupedResults).length} file{Object.keys(groupedResults).length !== 1 ? 's' : ''}
            </div>
            
            {Object.entries(groupedResults).map(([fileId, fileResults]) => (
              <div key={fileId} className="mb-2">
                <button
                  onClick={() => toggleFileExpanded(fileId)}
                  className="flex items-center gap-2 w-full px-2 py-1 hover:bg-editor-active-tab rounded text-left"
                >
                  {expandedFiles.has(fileId) ? (
                    <ChevronDown className="w-3 h-3 text-editor-text-muted" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-editor-text-muted" />
                  )}
                  <span className="text-sm font-medium text-editor-text">
                    {fileResults[0].fileName}
                  </span>
                  <span className="text-xs text-editor-text-muted">
                    ({fileResults.length})
                  </span>
                </button>
                
                {expandedFiles.has(fileId) && (
                  <div className="ml-6 space-y-1 mt-1">
                    {fileResults.map((result, index) => (
                      <button
                        key={`${result.fileId}-${result.line}-${index}`}
                        onClick={() => onResultClick(result.fileId, result.line)}
                        className="flex flex-col w-full px-2 py-1.5 hover:bg-editor-active-tab rounded text-left group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-editor-accent font-mono">
                            Line {result.line}
                          </span>
                        </div>
                        <code className="text-xs text-editor-text-muted font-mono truncate group-hover:text-editor-text">
                          {result.content}
                        </code>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
