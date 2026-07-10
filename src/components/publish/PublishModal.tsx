import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Globe, Loader2 } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (details: { name: string; description: string; category: string }) => Promise<void>;
}

export const PublishModal = ({ isOpen, onClose, onPublish }: PublishModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsPublishing(true);
    try {
      await onPublish({ name, description, category });
      onClose();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-editor-panel border border-editor-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-editor-border bg-editor-bg">
          <h2 className="text-lg font-semibold text-editor-text flex items-center gap-2">
            <Globe className="w-5 h-5 text-lavender-400" />
            Publish Project
          </h2>
          <button
            onClick={onClose}
            className="text-editor-text-muted hover:text-editor-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-editor-text-muted mb-1.5">
              Project Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Awesome App"
              required
              className="bg-editor-bg border-editor-border text-editor-text focus:border-lavender-500"
              disabled={isPublishing}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-editor-text-muted mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is your project about?"
              className="w-full bg-editor-bg border border-editor-border rounded-md px-3 py-2 text-sm text-editor-text focus:outline-none focus:ring-1 focus:ring-lavender-500 focus:border-lavender-500 resize-none h-24"
              disabled={isPublishing}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-editor-text-muted mb-1.5">
              Category
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Web App, Game, Utility"
              className="bg-editor-bg border-editor-border text-editor-text focus:border-lavender-500"
              disabled={isPublishing}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPublishing}
              className="text-editor-text-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isPublishing}
              className="bg-lavender-500 hover:bg-lavender-600 text-white min-w-[100px]"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing
                </>
              ) : (
                'Publish Now'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
