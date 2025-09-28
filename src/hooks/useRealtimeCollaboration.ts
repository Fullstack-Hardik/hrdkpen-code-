import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  user_id: string;
  display_name: string;
  role: 'host' | 'guest';
  is_online: boolean;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
    canViewYouTube: boolean;
  };
  last_seen: string;
}

interface CollaborationRoom {
  id: string;
  room_code: string;
  host_id: string;
  name: string;
  is_active: boolean;
}

interface FileChange {
  id: string;
  file_path: string;
  content: string;
  change_type: 'create' | 'update' | 'delete';
  description: string;
  created_at: string;
  user_id: string;
}

export const useRealtimeCollaboration = () => {
  const [currentRoom, setCurrentRoom] = useState<CollaborationRoom | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentRoom?.id) return;

    const membersChannel = supabase
      .channel(`room_members_${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${currentRoom.id}`
        },
        () => fetchTeamMembers()
      )
      .subscribe();

    const changesChannel = supabase
      .channel(`file_changes_${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'file_changes',
          filter: `room_id=eq.${currentRoom.id}`
        },
        (payload) => {
          setFileChanges(prev => [payload.new as FileChange, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(changesChannel);
    };
  }, [currentRoom?.id]);

  const fetchTeamMembers = useCallback(async () => {
    if (!currentRoom?.id) return;

    const { data, error } = await supabase
      .from('room_members')
      .select('*')
      .eq('room_id', currentRoom.id);

    if (error) {
      console.error('Error fetching team members:', error);
      return;
    }

    // Transform the data to match our interface
    const members: TeamMember[] = (data || []).map((member: any) => ({
      id: member.id,
      user_id: member.user_id,
      display_name: member.display_name,
      role: member.role as 'host' | 'guest',
      is_online: member.is_online,
      permissions: member.permissions as {
        canEdit: boolean;
        canDelete: boolean;
        canExport: boolean;
        canViewYouTube: boolean;
      },
      last_seen: member.last_seen
    }));

    setTeamMembers(members);
  }, [currentRoom?.id]);

  const createRoom = async (displayName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a collaboration room",
        variant: "destructive"
      });
      return;
    }

    const roomCode = Math.random().toString(36).substring(2, 9).toUpperCase();

    try {
      // Create room
      const { data: room, error: roomError } = await supabase
        .from('collaboration_rooms')
        .insert({
          room_code: roomCode,
          host_id: user.id,
          name: `${displayName}'s Session`
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add host as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'host',
          display_name: displayName,
          permissions: {
            canEdit: true,
            canDelete: true,
            canExport: true,
            canViewYouTube: true
          }
        });

      if (memberError) throw memberError;

      setCurrentRoom(room);
      setIsHost(true);
      setIsConnected(true);

      // Store room info in localStorage for persistence
      localStorage.setItem('collaboration_room', JSON.stringify({
        room_id: room.id,
        room_code: roomCode,
        role: 'host'
      }));

      toast({
        title: "Room Created",
        description: `Room code: ${roomCode}. Share this with your team.`
      });

      return roomCode;
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create room",
        variant: "destructive"
      });
    }
  };

  const joinRoom = async (roomCode: string, displayName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a collaboration room",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('collaboration_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (roomError || !room) {
        toast({
          title: "Room Not Found",
          description: "Invalid room code or room is not active",
          variant: "destructive"
        });
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single();

      if (!existingMember) {
        // Add user as member
        const { error: memberError } = await supabase
          .from('room_members')
          .insert({
            room_id: room.id,
            user_id: user.id,
            role: 'guest',
            display_name: displayName,
            permissions: {
              canEdit: true,
              canDelete: false,
              canExport: false,
              canViewYouTube: false
            }
          });

        if (memberError) throw memberError;
      } else {
        // Update existing member to online
        const { error: updateError } = await supabase
          .from('room_members')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('id', existingMember.id);

        if (updateError) throw updateError;
      }

      setCurrentRoom(room);
      setIsHost(room.host_id === user.id);
      setIsConnected(true);

      // Store room info in localStorage for persistence
      localStorage.setItem('collaboration_room', JSON.stringify({
        room_id: room.id,
        room_code: roomCode.toUpperCase(),
        role: room.host_id === user.id ? 'host' : 'guest'
      }));

      toast({
        title: "Joined Room",
        description: `Connected to ${room.name}`
      });

      return true;
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive"
      });
      return false;
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom || !user) return;

    try {
      if (isHost) {
        // Host leaves - deactivate room
        await supabase
          .from('collaboration_rooms')
          .update({ is_active: false })
          .eq('id', currentRoom.id);
      } else {
        // Guest leaves - mark as offline
        await supabase
          .from('room_members')
          .update({ is_online: false })
          .eq('room_id', currentRoom.id)
          .eq('user_id', user.id);
      }

      setCurrentRoom(null);
      setTeamMembers([]);
      setFileChanges([]);
      setIsConnected(false);
      setIsHost(false);

      // Clear localStorage
      localStorage.removeItem('collaboration_room');

      toast({
        title: "Left Room",
        description: "Disconnected from collaboration session"
      });
    } catch (error: any) {
      console.error('Error leaving room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to leave room",
        variant: "destructive"
      });
    }
  };

  const logFileChange = async (filePath: string, content: string, changeType: 'create' | 'update' | 'delete', description: string) => {
    if (!currentRoom || !user) return;

    try {
      await supabase
        .from('file_changes')
        .insert({
          room_id: currentRoom.id,
          user_id: user.id,
          file_path: filePath,
          content,
          change_type: changeType,
          description
        });
    } catch (error) {
      console.error('Error logging file change:', error);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!isHost || !currentRoom) return;

    try {
      await supabase
        .from('room_members')
        .delete()
        .eq('id', memberId);

      toast({
        title: "Member Removed",
        description: "Team member has been removed from the session"
      });
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  // Restore room on page load
  useEffect(() => {
    const restoreRoom = async () => {
      if (!user) return;

      const stored = localStorage.getItem('collaboration_room');
      if (!stored) return;

      try {
        const { room_id, role } = JSON.parse(stored);

        const { data: room, error } = await supabase
          .from('collaboration_rooms')
          .select('*')
          .eq('id', room_id)
          .eq('is_active', true)
          .single();

        if (error || !room) {
          localStorage.removeItem('collaboration_room');
          return;
        }

        setCurrentRoom(room);
        setIsHost(role === 'host');
        setIsConnected(true);

        // Update member status to online
        await supabase
          .from('room_members')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('room_id', room_id)
          .eq('user_id', user.id);

      } catch (error) {
        console.error('Error restoring room:', error);
        localStorage.removeItem('collaboration_room');
      }
    };

    restoreRoom();
  }, [user]);

  return {
    currentRoom,
    teamMembers,
    fileChanges,
    isConnected,
    isHost,
    user,
    createRoom,
    joinRoom,
    leaveRoom,
    logFileChange,
    removeMember,
    fetchTeamMembers
  };
};