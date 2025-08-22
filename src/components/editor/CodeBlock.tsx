import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Edit, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  onEdit?: (code: string) => void;
}

export const CodeBlock = ({ code, language, onEdit }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    onEdit?.(code);
  };

  return (
    <div className="relative group bg-editor-panel border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-editor-sidebar border-b border-border">
        <span className="text-xs font-medium text-editor-text-muted">{language}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2"
            title="Copy code"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-6 px-2"
              title="Edit code"
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      <pre className="p-3 text-sm overflow-x-auto">
        <code className="text-editor-text">{code}</code>
      </pre>
    </div>
  );
};