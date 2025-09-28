import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Copy, 
  UserCheck, 
  Crown, 
  Eye, 
  Clock, 
  Trash2,
  Shield,
  Settings,
  History,
  Download,
  ExternalLink,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';

export const TeamCollaboration = () => {
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('Anonymous User');
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const {
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
  } = useRealtimeCollaboration();

  const handleCreateRoom = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your display name",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const roomCode = await createRoom(displayName);
    if (roomCode) {
      setShowConnectionDialog(true);
    }
    setIsLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room code",
        variant: "destructive"
      });
      return;
    }

    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your display name",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const success = await joinRoom(joinCode, displayName);
    if (success) {
      setShowConnectionDialog(true);
      setJoinCode('');
    }
    setIsLoading(false);
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    setShowConnectionDialog(false);
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const copyRoomCode = () => {
    if (currentRoom?.room_code) {
      navigator.clipboard.writeText(currentRoom.room_code);
      toast({
        title: "Copied",
        description: "Room code copied to clipboard",
      });
    }
  };

  const copyRoomLink = () => {
    if (currentRoom?.room_code) {
      const link = `${window.location.origin}/?join=${currentRoom.room_code}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied",
        description: "Collaboration link copied to clipboard",
      });
    }
  };

  // Handle URL join parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinParam = urlParams.get('join');
    if (joinParam && !isConnected) {
      setJoinCode(joinParam);
    }
  }, [isConnected]);

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center">
            <Users className="w-5 h-5" />
            Team Collaboration
          </CardTitle>
          <CardDescription>
            Please sign in to use team collaboration features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Authentication is required to ensure secure collaboration and to maintain user permissions.
            </p>
            <Button 
              onClick={() => {
                // For now, create a simple mock user for demonstration
                toast({
                  title: "Demo Mode",
                  description: "Authentication will be implemented. For now, you can use the demo features.",
                });
              }}
              className="w-full"
            >
              Continue as Guest (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center gap-2 justify-center">
              <Users className="w-5 h-5" />
              Team Collaboration
            </CardTitle>
            <CardDescription>
              Collaborate on code in real-time with your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your Display Name</label>
                <Input
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <Tabs defaultValue="host" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="host">Host Session</TabsTrigger>
                  <TabsTrigger value="join">Join Session</TabsTrigger>
                </TabsList>
                
                <TabsContent value="host" className="space-y-4">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Create a new collaboration session and share the room code with your team
                    </p>
                    <Button 
                      onClick={handleCreateRoom}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Crown className="w-4 h-4 mr-2" />
                      )}
                      Create Room
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="join" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Room Code</label>
                      <Input
                        placeholder="Enter 7-character room code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={7}
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleJoinRoom}
                      className="w-full"
                      disabled={!joinCode.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4 mr-2" />
                      )}
                      Join Room
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Connection Success Dialog */}
        <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Successfully Connected!
              </DialogTitle>
              <DialogDescription>
                You are now connected to the collaboration session. You can start working together in real-time.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button onClick={() => setShowConnectionDialog(false)} className="flex-1">
                Start Collaborating
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isHost ? "default" : "secondary"} className="gap-1">
                {isHost ? <Crown className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {isHost ? 'Host' : 'Guest'}
              </Badge>
              <span className="text-sm text-muted-foreground">Room: {currentRoom?.room_code}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyRoomCode}>
                <Copy className="w-3 h-3 mr-1" />
                Copy Code
              </Button>
              <Button variant="outline" size="sm" onClick={copyRoomLink}>
                <ExternalLink className="w-3 h-3 mr-1" />
                Copy Link
              </Button>
              <Button variant="destructive" size="sm" onClick={handleLeaveRoom}>
                Leave Room
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="changes">Change History</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Active Members ({teamMembers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.display_name}</span>
                            {member.role === 'host' && <Crown className="w-3 h-3 text-yellow-500" />}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Last seen: {new Date(member.last_seen).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      {isHost && member.role !== 'host' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Change History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {fileChanges.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No changes recorded yet
                    </p>
                  ) : (
                    fileChanges.map((change) => (
                      <div key={change.id} className="p-3 rounded-lg border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">User {change.user_id.slice(0, 8)}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(change.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-blue-600 capitalize">{change.change_type}</span> in{' '}
                          <span className="font-mono text-xs bg-muted px-1 rounded">{change.file_path}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{change.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Permission Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-medium">{member.display_name}</span>
                      <Badge variant={member.role === 'host' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${member.permissions.canEdit ? 'bg-green-500' : 'bg-red-500'}`} />
                        Edit Files
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${member.permissions.canDelete ? 'bg-green-500' : 'bg-red-500'}`} />
                        Delete Files
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${member.permissions.canExport ? 'bg-green-500' : 'bg-red-500'}`} />
                        Export Project
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${member.permissions.canViewYouTube ? 'bg-green-500' : 'bg-red-500'}`} />
                        YouTube Features
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Collaboration Status */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">
                Real-time Collaboration Active
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Connected to Supabase. Live synchronization, user management, and change tracking are enabled.
                {teamMembers.length > 1 && ` ${teamMembers.length} users are currently collaborating.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};