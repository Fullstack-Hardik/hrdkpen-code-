import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FileNode } from '@/components/editor/ModernFileExplorer';

interface TeamMember {
  id: string;
  name: string;
  role: 'host' | 'guest';
  isActive: boolean;
}

interface TeamShareState {
  isHost: boolean;
  isConnected: boolean;
  shareLink: string;
  members: TeamMember[];
  sharedFiles: FileNode[];
}

export const useTeamShare = () => {
  const { toast } = useToast();
  const [state, setState] = useState<TeamShareState>({
    isHost: false,
    isConnected: false,
    shareLink: '',
    members: [],
    sharedFiles: []
  });

  // Generate shareable link
  const createSession = (hostName: string, files: FileNode[]) => {
    const sessionId = Math.random().toString(36).substring(7);
    const shareLink = `${window.location.origin}/?session=${encodeURIComponent(sessionId)}`;
    
    // Store session data
    const sessionData = {
      id: sessionId,
      host: hostName,
      files: files,
      created: new Date().toISOString()
    };
    
    localStorage.setItem(`team_session_${sessionId}`, JSON.stringify(sessionData));
    
    setState({
      isHost: true,
      isConnected: true,
      shareLink,
      members: [{ id: '1', name: hostName, role: 'host', isActive: true }],
      sharedFiles: files
    });

    toast({
      title: 'Session Created',
      description: 'Share the link to collaborate',
    });

    return shareLink;
  };

  // Join session
  const joinSession = (sessionId: string, guestName: string) => {
    const sessionData = localStorage.getItem(`team_session_${sessionId}`);
    
    if (!sessionData) {
      toast({
        title: 'Session Not Found',
        description: 'The session link is invalid or expired',
        variant: 'destructive'
      });
      return false;
    }

    const session = JSON.parse(sessionData);
    
    setState({
      isHost: false,
      isConnected: true,
      shareLink: '',
      members: [
        { id: '1', name: session.host, role: 'host', isActive: true },
        { id: '2', name: guestName, role: 'guest', isActive: true }
      ],
      sharedFiles: session.files
    });

    toast({
      title: 'Joined Session',
      description: `Connected to ${session.host}'s session`,
    });

    return true;
  };

  // Leave session
  const leaveSession = () => {
    setState({
      isHost: false,
      isConnected: false,
      shareLink: '',
      members: [],
      sharedFiles: []
    });

    toast({
      title: 'Left Session',
      description: 'You have disconnected from the team session',
    });
  };

  // Kick member (host only)
  const kickMember = (memberId: string) => {
    if (!state.isHost) return;
    
    setState(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId)
    }));
  };

  // Sync file changes
  const syncFileChange = (fileId: string, content: string) => {
    // In a real implementation, this would use WebSocket or Supabase
    console.log('Syncing file change:', fileId, content);
  };

  // Check for session on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    
    if (sessionId) {
      // Auto-join if session link is in URL
      const guestName = prompt('Enter your name to join:');
      if (guestName) {
        joinSession(decodeURIComponent(sessionId), guestName);
      }
    }
  }, []);

  // Persist connection on reload
  useEffect(() => {
    if (state.isConnected) {
      sessionStorage.setItem('team_state', JSON.stringify(state));
    }
  }, [state]);

  // Restore connection on reload
  useEffect(() => {
    const savedState = sessionStorage.getItem('team_state');
    if (savedState) {
      setState(JSON.parse(savedState));
    }
  }, []);

  return {
    ...state,
    createSession,
    joinSession,
    leaveSession,
    kickMember,
    syncFileChange
  };
};