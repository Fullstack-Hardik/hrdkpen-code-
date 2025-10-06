import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
}

interface TeamMember {
  id: string;
  user_id: string;
  display_name: string;
  is_online: boolean;
  role: 'host' | 'guest';
  last_seen: string;
}

interface FileChange {
  id: string;
  file_path: string;
  content: string;
  change_type: 'create' | 'update' | 'delete';
  user_id: string;
  created_at: string;
}

export const useTeamSync = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [changes, setChanges] = useState<FileChange[]>([]);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Restore session on reload
  useEffect(() => {
    if (!user) return;
    
    const savedRoomId = localStorage.getItem('team_room_id');
    const savedRoomCode = localStorage.getItem('team_room_code');
    const savedIsHost = localStorage.getItem('team_is_host') === 'true';
    
    if (savedRoomId && savedRoomCode) {
      setRoomId(savedRoomId);
      setRoomCode(savedRoomCode);
      setIsHost(savedIsHost);
      setIsConnected(true);
      updatePresence(savedRoomId, true);
    }
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!roomId) return;

    // Subscribe to team members
    const membersChannel = supabase
      .channel(`room_members_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`
        },
        () => fetchTeamMembers()
      )
      .subscribe();

    // Subscribe to file changes
    const changesChannel = supabase
      .channel(`file_changes_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'file_changes',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const change = payload.new as FileChange;
          setChanges(prev => [change, ...prev]);
          
          // Apply change to files
          if (change.user_id !== user?.id) {
            applyFileChange(change);
          }
        }
      )
      .subscribe();

    fetchTeamMembers();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(changesChannel);
    };
  }, [roomId, user]);

  const fetchTeamMembers = useCallback(async () => {
    if (!roomId) return;

    const { data, error } = await supabase
      .from('room_members')
      .select('*')
      .eq('room_id', roomId);

    if (error) {
      console.error('Error fetching members:', error);
      return;
    }

    const members: TeamMember[] = (data || []).map(m => ({
      id: m.id,
      user_id: m.user_id || '',
      display_name: m.display_name,
      is_online: m.is_online || false,
      role: (m.role === 'host' ? 'host' : 'guest') as 'host' | 'guest',
      last_seen: m.last_seen
    }));

    setTeamMembers(members);
  }, [roomId]);

  const updatePresence = async (rid: string, online: boolean) => {
    if (!user) return;

    await supabase
      .from('room_members')
      .update({ 
        is_online: online,
        last_seen: new Date().toISOString()
      })
      .eq('room_id', rid)
      .eq('user_id', user.id);
  };

  const createRoom = async (displayName: string) => {
    if (!user) return null;

    const code = Math.random().toString(36).substring(2, 9).toUpperCase();

    const { data: room, error: roomError } = await supabase
      .from('collaboration_rooms')
      .insert({
        room_code: code,
        host_id: user.id,
        name: `${displayName}'s Session`,
        is_active: true
      })
      .select()
      .single();

    if (roomError || !room) {
      toast({
        title: 'Error',
        description: 'Failed to create room',
        variant: 'destructive'
      });
      return null;
    }

    const { error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName,
        role: 'host',
        is_online: true
      });

    if (memberError) {
      toast({
        title: 'Error',
        description: 'Failed to join room',
        variant: 'destructive'
      });
      return null;
    }

    setRoomId(room.id);
    setRoomCode(code);
    setIsHost(true);
    setIsConnected(true);

    localStorage.setItem('team_room_id', room.id);
    localStorage.setItem('team_room_code', code);
    localStorage.setItem('team_is_host', 'true');

    toast({
      title: 'Room Created',
      description: `Room code: ${code}`
    });

    return code;
  };

  const joinRoom = async (code: string, displayName: string) => {
    if (!user) return false;

    const { data: room, error: roomError } = await supabase
      .from('collaboration_rooms')
      .select('*')
      .eq('room_code', code)
      .eq('is_active', true)
      .single();

    if (roomError || !room) {
      toast({
        title: 'Error',
        description: 'Room not found',
        variant: 'destructive'
      });
      return false;
    }

    const { error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName,
        role: 'guest',
        is_online: true
      });

    if (memberError) {
      toast({
        title: 'Error',
        description: 'Failed to join room',
        variant: 'destructive'
      });
      return false;
    }

    setRoomId(room.id);
    setRoomCode(code);
    setIsHost(false);
    setIsConnected(true);

    localStorage.setItem('team_room_id', room.id);
    localStorage.setItem('team_room_code', code);
    localStorage.setItem('team_is_host', 'false');

    toast({
      title: 'Joined Room',
      description: `Connected to ${room.name}`
    });

    return true;
  };

  const leaveRoom = async () => {
    if (!roomId || !user) return;

    await updatePresence(roomId, false);

    if (isHost) {
      await supabase
        .from('collaboration_rooms')
        .update({ is_active: false })
        .eq('id', roomId);
    }

    localStorage.removeItem('team_room_id');
    localStorage.removeItem('team_room_code');
    localStorage.removeItem('team_is_host');

    setRoomId(null);
    setRoomCode(null);
    setIsHost(false);
    setIsConnected(false);
    setTeamMembers([]);

    toast({
      title: isHost ? 'Session Ended' : 'Left Room',
      description: isHost ? 'Collaboration session ended' : 'You left the room'
    });
  };

  const syncFile = async (filePath: string, content: string, changeType: 'create' | 'update' | 'delete') => {
    if (!roomId || !user) return;

    const { error } = await supabase
      .from('file_changes')
      .insert({
        room_id: roomId,
        user_id: user.id,
        file_path: filePath,
        content: content,
        change_type: changeType,
        description: `${changeType} ${filePath}`
      });

    if (error) {
      console.error('Error syncing file:', error);
    }
  };

  const applyFileChange = (change: FileChange) => {
    // This will be implemented to update the file tree
    toast({
      title: 'File Updated',
      description: `${change.file_path} was ${change.change_type}d by team member`,
    });
  };

  return {
    roomId,
    roomCode,
    isHost,
    isConnected,
    teamMembers,
    files,
    changes,
    user,
    createRoom,
    joinRoom,
    leaveRoom,
    syncFile,
    updatePresence
  };
};
