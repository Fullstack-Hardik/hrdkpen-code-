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

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'file' | 'notification';
  created_at: string;
}

interface Notification {
  id: string;
  room_id: string;
  user_id: string;
  notification_type: 'joined' | 'left' | 'connected' | 'disconnected';
  message: string;
  created_at: string;
}

interface LocalSave {
  id: string;
  room_id: string;
  user_id: string;
  file_path: string;
  content: string;
  is_auto_save: boolean;
  created_at: string;
}

export const useEnhancedCollaboration = () => {
  const [currentRoom, setCurrentRoom] = useState<CollaborationRoom | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [localSaves, setLocalSaves] = useState<LocalSave[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
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

  // Auto-reconnect on page load
  useEffect(() => {
    const restoreConnection = async () => {
      if (!user) return;
      
      const stored = localStorage.getItem('collaboration_room');
      if (!stored) return;

      try {
        const { room_id, role } = JSON.parse(stored);
        setConnectionStatus('connecting');

        const { data: room, error } = await supabase
          .from('collaboration_rooms')
          .select('*')
          .eq('id', room_id)
          .eq('is_active', true)
          .single();

        if (error || !room) {
          localStorage.removeItem('collaboration_room');
          setConnectionStatus('disconnected');
          return;
        }

        setCurrentRoom(room);
        setIsHost(role === 'host');
        setIsConnected(true);
        setConnectionStatus('connected');

        // Update member status to online
        await supabase
          .from('room_members')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('room_id', room_id)
          .eq('user_id', user.id);

        // Send reconnection notification
        await createNotification(room_id, 'connected', 'Reconnected to the session');

      } catch (error) {
        console.error('Error restoring connection:', error);
        localStorage.removeItem('collaboration_room');
        setConnectionStatus('disconnected');
      }
    };

    if (user) {
      restoreConnection();
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentRoom?.id) return;

    const channels = [];

    // Members channel
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
    channels.push(membersChannel);

    // File changes channel
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
    channels.push(changesChannel);

    // Chat channel
    const chatChannel = supabase
      .channel(`team_chat_${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat',
          filter: `room_id=eq.${currentRoom.id}`
        },
        (payload) => {
          setChatMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();
    channels.push(chatChannel);

    // Notifications channel
    const notificationsChannel = supabase
      .channel(`notifications_${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connection_notifications',
          filter: `room_id=eq.${currentRoom.id}`
        },
        (payload) => {
          const notification = payload.new as Notification;
          setNotifications(prev => [notification, ...prev]);
          
          // Show toast for new notifications
          if (notification.user_id !== user?.id) {
            toast({
              title: notification.notification_type.charAt(0).toUpperCase() + notification.notification_type.slice(1),
              description: notification.message,
            });
          }
        }
      )
      .subscribe();
    channels.push(notificationsChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [currentRoom?.id, user?.id]);

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

  const createNotification = async (roomId: string, type: Notification['notification_type'], message: string) => {
    if (!user) return;

    try {
      await supabase
        .from('connection_notifications')
        .insert({
          room_id: roomId,
          user_id: user.id,
          notification_type: type,
          message
        });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

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
    setConnectionStatus('connecting');

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
      setConnectionStatus('connected');

      // Store room info in localStorage for persistence
      localStorage.setItem('collaboration_room', JSON.stringify({
        room_id: room.id,
        room_code: roomCode,
        role: 'host'
      }));

      // Create notification
      await createNotification(room.id, 'joined', `${displayName} created the session`);

      toast({
        title: "Room Created",
        description: `Room code: ${roomCode}. Share this with your team.`
      });

      return roomCode;
    } catch (error: any) {
      console.error('Error creating room:', error);
      setConnectionStatus('disconnected');
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

    setConnectionStatus('connecting');

    try {
      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('collaboration_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (roomError || !room) {
        setConnectionStatus('disconnected');
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
      setConnectionStatus('connected');

      // Store room info in localStorage for persistence
      localStorage.setItem('collaboration_room', JSON.stringify({
        room_id: room.id,
        room_code: roomCode.toUpperCase(),
        role: room.host_id === user.id ? 'host' : 'guest'
      }));

      // Create notification
      await createNotification(room.id, 'joined', `${displayName} joined the session`);

      toast({
        title: "Joined Room",
        description: `Connected to ${room.name}`
      });

      return true;
    } catch (error: any) {
      console.error('Error joining room:', error);
      setConnectionStatus('disconnected');
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

        await createNotification(currentRoom.id, 'left', 'Host ended the session');
      } else {
        // Guest leaves - mark as offline
        await supabase
          .from('room_members')
          .update({ is_online: false })
          .eq('room_id', currentRoom.id)
          .eq('user_id', user.id);

        await createNotification(currentRoom.id, 'left', 'Member left the session');
      }

      setCurrentRoom(null);
      setTeamMembers([]);
      setFileChanges([]);
      setChatMessages([]);
      setNotifications([]);
      setIsConnected(false);
      setIsHost(false);
      setConnectionStatus('disconnected');

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

  const sendChatMessage = async (message: string) => {
    if (!currentRoom || !user) return;

    try {
      await supabase
        .from('team_chat')
        .insert({
          room_id: currentRoom.id,
          user_id: user.id,
          message,
          message_type: 'text'
        });
    } catch (error) {
      console.error('Error sending chat message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
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

  const autoSave = async (filePath: string, content: string) => {
    if (!currentRoom || !user) return;

    try {
      // Upsert local save
      const { error } = await supabase
        .from('local_saves')
        .upsert({
          room_id: currentRoom.id,
          user_id: user.id,
          file_path: filePath,
          content,
          is_auto_save: true
        }, {
          onConflict: 'room_id,user_id,file_path'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error auto-saving:', error);
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

  // Load chat messages and notifications
  useEffect(() => {
    const loadData = async () => {
      if (!currentRoom?.id) return;

      try {
        // Load chat messages
        const { data: chatData } = await supabase
          .from('team_chat')
          .select('*')
          .eq('room_id', currentRoom.id)
          .order('created_at', { ascending: true })
          .limit(50);

        if (chatData) setChatMessages(chatData as ChatMessage[]);

        // Load notifications
        const { data: notificationData } = await supabase
          .from('connection_notifications')
          .select('*')
          .eq('room_id', currentRoom.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (notificationData) setNotifications(notificationData as Notification[]);

        // Load file changes
        const { data: changesData } = await supabase
          .from('file_changes')
          .select('*')
          .eq('room_id', currentRoom.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (changesData) setFileChanges(changesData as FileChange[]);

      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [currentRoom?.id]);

  return {
    currentRoom,
    teamMembers,
    fileChanges,
    chatMessages,
    notifications,
    localSaves,
    isConnected,
    isHost,
    user,
    connectionStatus,
    createRoom,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    logFileChange,
    autoSave,
    removeMember,
    fetchTeamMembers
  };
};