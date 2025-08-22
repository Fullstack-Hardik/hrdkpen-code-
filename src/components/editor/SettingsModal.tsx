import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings } from './Settings';
import { FiSettings } from 'react-icons/fi';

interface SettingsModalProps {
  trigger?: React.ReactNode;
}

export const SettingsModal = ({ trigger }: SettingsModalProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger || (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-8 px-3"
          title="Settings"
        >
          <FiSettings className="w-4 h-4" />
        </Button>
      )}
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <Settings onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};