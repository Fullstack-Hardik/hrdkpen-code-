import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Copy, UserPlus, Wifi, WifiOff, Crown, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  ip: string;
  role: 'host' | 'guest';
  connected: boolean;
  lastSeen: Date;
}

export const TeamCodeSettings = () => {
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const { toast } = useToast();

  // Generate unique 7-character room code
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createRoom = async () => {
    try {
      setConnectionStatus('connecting');
      const code = generateRoomCode();
      setRoomCode(code);
      setIsHost(true);
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // TODO: Integrate with Supabase for real-time collaboration
      // For now, simulate room creation
      toast({
        title: "Room Created Successfully",
        description: `Room code: ${code}. Share this with your team members.`,
      });
      
      // Add host as first member
      const hostMember: TeamMember = {
        id: 'host-' + Date.now(),
        name: 'You (Host)',
        ip: 'localhost',
        role: 'host',
        connected: true,
        lastSeen: new Date()
      };
      setTeamMembers([hostMember]);
      
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "Failed to Create Room",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim() || joinCode.length !== 7) {
      toast({
        title: "Invalid Room Code",
        description: "Please enter a valid 7-character room code.",
        variant: "destructive"
      });
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // TODO: Integrate with Supabase to join existing room
      // For now, simulate joining
      setIsHost(false);
      setRoomCode(joinCode);
      setIsConnected(true);
      setConnectionStatus('connected');
      
      toast({
        title: "Joined Room Successfully",
        description: `Connected to room: ${joinCode}`,
      });
      
      // Simulate existing team members
      const mockMembers: TeamMember[] = [
        {
          id: 'host-1',
          name: 'Room Host',
          ip: '192.168.1.100',
          role: 'host',
          connected: true,
          lastSeen: new Date()
        },
        {
          id: 'guest-' + Date.now(),
          name: 'You',
          ip: 'localhost',
          role: 'guest',
          connected: true,
          lastSeen: new Date()
        }
      ];
      setTeamMembers(mockMembers);
      
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "Failed to Join Room",
        description: "Room not found or connection failed.",
        variant: "destructive"
      });
    }
  };

  const leaveRoom = () => {
    setIsConnected(false);
    setIsHost(false);
    setRoomCode('');
    setJoinCode('');
    setTeamMembers([]);
    setConnectionStatus('disconnected');
    
    toast({
      title: "Left Room",
      description: "You have disconnected from the collaboration session.",
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: "Room Code Copied",
      description: "Share this code with your team members.",
    });
  };

  const removeMember = (memberId: string) => {
    if (!isHost) return;
    
    setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    toast({
      title: "Member Removed",
      description: "Team member has been removed from the session.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 text-editor-text">Team Collaboration</h3>
        <p className="text-sm text-editor-text-muted">
          Collaborate in real-time with your team members. Host or join a coding session.
        </p>
      </div>

      {!isConnected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Host Section */}
          <Card className="bg-editor-sidebar border-editor-border">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-editor-text">
                <Crown className="w-5 h-5 text-yellow-500" />
                Host Session
              </CardTitle>
              <CardDescription className="text-editor-text-muted">
                Create a new collaboration room
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={createRoom}
                disabled={connectionStatus === 'connecting'}
                className="w-full bg-editor-accent hover:bg-editor-accent/80 text-white"
              >
                {connectionStatus === 'connecting' ? 'Creating...' : 'Create Room'}
              </Button>
              <Alert className="bg-editor-panel border-editor-border">
                <Shield className="w-4 h-4" />
                <AlertDescription className="text-editor-text-muted">
                  As host, you control member access and can see all changes in real-time.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Join Section */}
          <Card className="bg-editor-sidebar border-editor-border">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-editor-text">
                <UserPlus className="w-5 h-5 text-green-500" />
                Join Session
              </CardTitle>
              <CardDescription className="text-editor-text-muted">
                Join an existing collaboration room
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter 7-character room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={7}
                className="bg-editor-panel border-editor-border text-editor-text text-center font-mono"
              />
              <Button 
                onClick={joinRoom}
                disabled={connectionStatus === 'connecting' || !joinCode.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {connectionStatus === 'connecting' ? 'Joining...' : 'Join Room'}
              </Button>
              <Alert className="bg-editor-panel border-editor-border">
                <Users className="w-4 h-4" />
                <AlertDescription className="text-editor-text-muted">
                  Your changes will be visible to all team members with color coding.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connection Status */}
          <Card className="bg-editor-sidebar border-editor-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-editor-text">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-green-500" />
                  Connected to Room
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  {isHost ? 'Host' : 'Guest'}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span className="text-editor-text-muted">Room Code: {roomCode}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyRoomCode}
                  className="h-6 px-2 text-editor-accent hover:bg-editor-panel"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Team Members */}
          <Card className="bg-editor-sidebar border-editor-border">
            <CardHeader>
              <CardTitle className="text-editor-text">Team Members ({teamMembers.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-editor-panel rounded-lg border border-editor-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${member.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-editor-text">{member.name}</span>
                        {member.role === 'host' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <span className="text-xs text-editor-text-muted">{member.ip}</span>
                    </div>
                  </div>
                  
                  {isHost && member.role !== 'host' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                      className="h-6 px-2 text-red-500 hover:bg-red-500/10"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Collaboration Features */}
          <Card className="bg-editor-sidebar border-editor-border">
            <CardHeader>
              <CardTitle className="text-editor-text">Collaboration Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-editor-text-muted">Your changes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-editor-text-muted">Others' changes</span>
                </div>
              </div>
              <Alert className="bg-editor-panel border-editor-border">
                <AlertDescription className="text-editor-text-muted text-xs">
                  All changes are synchronized in real-time. Use Ctrl+Z to undo your own changes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Leave Room */}
          <Button
            onClick={leaveRoom}
            variant="outline"
            className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
          >
            <WifiOff className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
        </div>
      )}

      {/* Supabase Integration Notice */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Team collaboration requires Supabase integration for real-time synchronization. 
          Click the Supabase button in the top-right to set up the backend.
        </AlertDescription>
      </Alert>
    </div>
  );
};