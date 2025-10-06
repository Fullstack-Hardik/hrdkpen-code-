import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  sender?: {
    display_name: string;
  };
  receiver?: {
    display_name: string;
  };
}

interface OnlineUser {
  id: string;
  user_id: string;
  display_name: string;
  last_seen: string;
  is_available: boolean;
}

export const useConnectionRequests = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set user as online when authenticated
  useEffect(() => {
    if (!user) return;

    const setOnline = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      await supabase
        .from('online_users')
        .upsert({
          user_id: user.id,
          display_name: profile?.display_name || 'Anonymous User',
          is_available: true,
          last_seen: new Date().toISOString()
        });
    };

    setOnline();

    // Update last_seen every 30 seconds
    const interval = setInterval(() => {
      supabase
        .from('online_users')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', user.id)
        .then();
    }, 30000);

    // Set offline on unmount
    return () => {
      clearInterval(interval);
      supabase
        .from('online_users')
        .delete()
        .eq('user_id', user.id)
        .then();
    };
  }, [user]);

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('online_users')
      .select('*')
      .neq('user_id', user.id);

    if (error) {
      console.error('Error fetching online users:', error);
      return;
    }

    setOnlineUsers(data || []);
  }, [user]);

  // Fetch connection requests
  const fetchConnectionRequests = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connection_requests')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching connection requests:', error);
      return;
    }

    // Fetch display names separately
    const requestsWithNames = await Promise.all(
      (data || []).map(async (request) => {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', request.sender_id)
          .single();

        const { data: receiverProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', request.receiver_id)
          .single();

        return {
          ...request,
          sender: senderProfile,
          receiver: receiverProfile
        };
      })
    );

    setConnectionRequests(requestsWithNames as ConnectionRequest[]);
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    fetchOnlineUsers();
    fetchConnectionRequests();

    // Subscribe to online users
    const onlineUsersChannel = supabase
      .channel('online_users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_users'
        },
        () => fetchOnlineUsers()
      )
      .subscribe();

    // Subscribe to connection requests
    const requestsChannel = supabase
      .channel('connection_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_requests',
          filter: `sender_id=eq.${user.id},receiver_id=eq.${user.id}`
        },
        () => fetchConnectionRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(onlineUsersChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [user, fetchOnlineUsers, fetchConnectionRequests]);

  const sendConnectionRequest = async (receiverId: string) => {
    if (!user) return;

    // Check if request already exists
    const existing = connectionRequests.find(
      r => (r.sender_id === user.id && r.receiver_id === receiverId) ||
           (r.sender_id === receiverId && r.receiver_id === user.id)
    );

    if (existing) {
      if (existing.status === 'blocked') {
        toast({
          title: 'Request Blocked',
          description: 'You cannot send a connection request to this user',
          variant: 'destructive'
        });
        return;
      }
      toast({
        title: 'Request Already Exists',
        description: 'A connection request already exists with this user',
        variant: 'destructive'
      });
      return;
    }

    const { error } = await supabase
      .from('connection_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      });

    if (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send connection request',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Request Sent',
      description: 'Connection request sent successfully'
    });
  };

  const acceptConnectionRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      console.error('Error accepting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept connection request',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Request Accepted',
      description: 'You can now collaborate with this user'
    });
  };

  const blockConnectionRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'blocked' })
      .eq('id', requestId);

    if (error) {
      console.error('Error blocking request:', error);
      toast({
        title: 'Error',
        description: 'Failed to block connection request',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Request Blocked',
      description: 'This user will not be able to send you requests'
    });
  };

  const pendingRequests = connectionRequests.filter(
    r => r.status === 'pending' && r.receiver_id === user?.id
  );

  const acceptedConnections = connectionRequests.filter(
    r => r.status === 'accepted'
  );

  return {
    onlineUsers,
    connectionRequests,
    pendingRequests,
    acceptedConnections,
    user,
    sendConnectionRequest,
    acceptConnectionRequest,
    blockConnectionRequest
  };
};
