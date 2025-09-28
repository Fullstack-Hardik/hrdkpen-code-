import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  role: 'host' | 'guest';
  status: 'online' | 'offline';
  lastSeen: Date;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
    canViewYouTube: boolean;
  };
}

interface ChangeLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  file: string;
  changes: string;
}

export const TeamCollaboration = () => {
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const { toast } = useToast();

  // Generate unique room code
  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 9).toUpperCase();
    setRoomCode(code);
    setIsHost(true);
    setIsConnected(true);
    
    // Add host to team members
    const hostMember: TeamMember = {
      id: 'host',
      name: 'You (Host)',
      role: 'host',
      status: 'online',
      lastSeen: new Date(),
      permissions: {
        canEdit: true,
        canDelete: true,
        canExport: true,
        canViewYouTube: true
      }
    };
    setTeamMembers([hostMember]);
    
    toast({
      title: "Room Created",
      description: `Room code: ${code}. Share this with your team.`,
    });
  };

  // Join existing room
  const joinRoom = () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room code",
        variant: "destructive"
      });
      return;
    }
    
    setRoomCode(joinCode);
    setIsHost(false);
    setIsConnected(true);
    
    // Add guest to team members (simulated)
    const guestMember: TeamMember = {
      id: 'guest',
      name: 'You (Guest)',
      role: 'guest',
      status: 'online',
      lastSeen: new Date(),
      permissions: {
        canEdit: true,
        canDelete: false,
        canExport: false,
        canViewYouTube: false
      }
    };
    setTeamMembers([guestMember]);
    
    toast({
      title: "Joined Room",
      description: `Connected to room ${joinCode}`,
    });
  };

  // Leave room
  const leaveRoom = () => {
    setIsConnected(false);
    setIsHost(false);
    setRoomCode('');
    setJoinCode('');
    setTeamMembers([]);
    setChangeLogs([]);
    
    toast({
      title: "Left Room",
      description: "Disconnected from collaboration session",
    });
  };

  // Copy room code
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: "Copied",
      description: "Room code copied to clipboard",
    });
  };

  // Remove team member (host only)
  const removeMember = (memberId: string) => {
    if (!isHost) return;
    
    setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    toast({
      title: "Member Removed",
      description: "Team member has been removed from the session",
    });
  };

  // Mock change log entry
  const addChangeLog = (action: string, file: string, changes: string) => {
    const newLog: ChangeLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      user: isHost ? 'Host' : 'Guest',
      action,
      file,
      changes
    };
    setChangeLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 changes
  };

  if (!isConnected) {
    return (
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
                  onClick={generateRoomCode}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
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
                  onClick={joinRoom}
                  className="w-full"
                  disabled={!joinCode.trim()}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Join Room
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
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
              <span className="text-sm text-muted-foreground">Room: {roomCode}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyRoomCode}>
                <Copy className="w-3 h-3 mr-1" />
                Copy Code
              </Button>
              <Button variant="destructive" size="sm" onClick={leaveRoom}>
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
                        <div className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name}</span>
                            {member.role === 'host' && <Crown className="w-3 h-3 text-yellow-500" />}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Last seen: {member.lastSeen.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      {isHost && member.id !== 'host' && (
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
                  {changeLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No changes recorded yet
                    </p>
                  ) : (
                    changeLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{log.user}</span>
                          <span className="text-xs text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-blue-600">{log.action}</span> in{' '}
                          <span className="font-mono text-xs bg-muted px-1 rounded">{log.file}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.changes}</p>
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
                      <span className="font-medium">{member.name}</span>
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

      {/* Real-time Collaboration Notice */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                Supabase Integration Required
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                To enable real-time collaboration, connect your project to Supabase using the green button in the top right corner. 
                This will enable live code synchronization, user management, and change tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};