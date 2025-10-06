import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { useConnectionRequests } from '@/hooks/useConnectionRequests';

export const LiveUsersList = () => {
  const {
    onlineUsers,
    pendingRequests,
    acceptedConnections,
    sendConnectionRequest,
    acceptConnectionRequest,
    blockConnectionRequest,
    user
  } = useConnectionRequests();

  const isConnected = (userId: string) => {
    return acceptedConnections.some(
      r => r.sender_id === userId || r.receiver_id === userId
    );
  };

  const hasPendingRequest = (userId: string) => {
    return pendingRequests.some(
      r => r.sender_id === userId || r.receiver_id === userId
    );
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Live Users
          </CardTitle>
          <CardDescription>Please sign in to see online users</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Connection Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{request.sender?.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Wants to connect with you
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptConnectionRequest(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => blockConnectionRequest(request.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Block
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Online Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Online Users ({onlineUsers.length})
          </CardTitle>
          <CardDescription>
            Send connection requests to collaborate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {onlineUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No other users online
                </p>
              ) : (
                onlineUsers.map((onlineUser) => (
                  <div key={onlineUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <div>
                        <p className="font-medium">{onlineUser.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Online now
                        </p>
                      </div>
                    </div>
                    {isConnected(onlineUser.user_id) ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : hasPendingRequest(onlineUser.user_id) ? (
                      <Badge variant="secondary">Pending</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => sendConnectionRequest(onlineUser.user_id)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
