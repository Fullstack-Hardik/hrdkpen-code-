import { Button } from '@/components/ui/button';
import { FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface SettingsModalProps {
  trigger?: React.ReactNode;
}

export const SettingsModal = ({ trigger }: SettingsModalProps) => {
  const navigate = useNavigate();

  return (
    <>
      {trigger || (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/settings')}
          className="h-8 px-3"
          title="Settings"
        >
          <FiSettings className="w-4 h-4" />
        </Button>
      )}
    </>
  );
};