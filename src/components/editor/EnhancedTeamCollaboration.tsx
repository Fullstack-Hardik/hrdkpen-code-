import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Loader2,
  Wifi,
  WifiOff,
  MessageSquare,
  Save,
  RefreshCw,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Link,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedCollaboration } from '@/hooks/useEnhancedCollaboration';
import { TeamChat } from './TeamChat';
import { AuthForm } from '../auth/AuthForm';

interface EnhancedTeamCollaborationProps {
  onFileChange?: (filePath: string, content: string, changeType: 'create' | 'update' | 'delete', description: string) => void;
}

export const EnhancedTeamCollaboration = ({ onFileChange }: EnhancedTeamCollaborationProps) => {
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentTab, setCurrentTab] = useState('overview');
  const { toast } = useToast();
  
  const {
    currentRoom,
    teamMembers,
    fileChanges,
    chatMessages,
    notifications,
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
  } = useEnhancedCollaboration();

  // Handle URL join parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinParam = urlParams.get('join');
    if (joinParam && !isConnected && user) {
      setJoinCode(joinParam);
      // Auto-focus on display name if URL has join code
      const timer = setTimeout(() => {
        const nameInput = document.querySelector('input[placeholder*="display name"]') as HTMLInputElement;
        if (nameInput) nameInput.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isConnected, user]);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data } = await fetch('/api/user/profile').then(res => res.json());
        if (data?.display_name) {
          setDisplayName(data.display_name);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    
    loadProfile();
  }, [user]);

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

  const saveSettings = () => {
    localStorage.setItem('collaboration_settings', JSON.stringify({
      autoSaveEnabled,
      notificationsEnabled
    }));
    setShowSettingsDialog(false);
    toast({
      title: "Settings Saved",
      description: "Your collaboration settings have been saved"
    });
  };

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('collaboration_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setAutoSaveEnabled(settings.autoSaveEnabled ?? true);
        setNotificationsEnabled(settings.notificationsEnabled ?? true);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Handle file changes
  useEffect(() => {
    if (onFileChange && logFileChange) {
      // This would be connected to your file system events
      // For now, it's a placeholder for the integration
    }
  }, [onFileChange, logFileChange]);

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
          <AuthForm />
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
                  placeholder="Enter your display name"
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
                      disabled={isLoading || connectionStatus === 'connecting'}
                    >
                      {isLoading || connectionStatus === 'connecting' ? (
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
                      disabled={!joinCode.trim() || isLoading || connectionStatus === 'connecting'}
                    >
                      {isLoading || connectionStatus === 'connecting' ? (
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

        {/* Connection Dialog */}
        <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Successfully Connected!
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {connectionStatus === 'connected' 
                  ? 'You are now connected to the collaboration session. You can start working together in real-time.'
                  : 'Establishing connection to the collaboration session...'
                }
              </DialogDescription>
            </DialogHeader>
            {connectionStatus === 'connected' && (
              <div className="flex gap-2">
                <Button onClick={() => setShowConnectionDialog(false)} className="flex-1">
                  Start Collaborating
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : connectionStatus === 'connecting' ? (
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <Badge variant={isHost ? "default" : "secondary"} className="gap-1">
                  {isHost ? <Crown className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {isHost ? 'Host' : 'Guest'}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                Room: {currentRoom?.room_code} • {teamMembers.filter(m => m.is_online).length} online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyRoomCode}>
                <Copy className="w-3 h-3 mr-1" />
                Code
              </Button>
              <Button variant="outline" size="sm" onClick={copyRoomLink}>
                <Link className="w-3 h-3 mr-1" />
                Link
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSettingsDialog(true)}>
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
              <Button variant="destructive" size="sm" onClick={handleLeaveRoom}>
                {isHost ? 'End Session' : 'Leave'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">
            Chat
            {chatMessages.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {chatMessages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Members ({teamMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
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
                            <UserMinus className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {[...notifications, ...fileChanges].slice(0, 10).map((item) => (
                      <div key={item.id} className="p-2 rounded border-l-2 border-blue-500 bg-muted/50">
                        <div className="text-sm">
                          {'notification_type' in item ? item.message : 
                           `${item.change_type} ${item.file_path}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <TeamChat
                messages={chatMessages}
                notifications={notifications}
                teamMembers={teamMembers}
                currentUserId={user?.id}
                connectionStatus={connectionStatus}
                onSendMessage={sendChatMessage}
                onOpenSettings={() => setShowSettingsDialog(true)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-4 h-4" />
                File Changes
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
                          <Badge variant="outline" className="mr-2">
                            {change.change_type}
                          </Badge>
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

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security & Permissions
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

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collaboration Settings</DialogTitle>
            <DialogDescription>
              Configure your collaboration preferences and security settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">Auto-save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save your work to the cloud
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show connection and activity notifications
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveSettings}>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Card */}
      <Card className={`border-2 ${
        connectionStatus === 'connected' 
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
          : connectionStatus === 'connecting'
          ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
          : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            {connectionStatus === 'connected' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : connectionStatus === 'connecting' ? (
              <Loader2 className="w-5 h-5 text-yellow-600 mt-0.5 animate-spin" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div>
              <h4 className={`font-medium ${
                connectionStatus === 'connected' 
                  ? 'text-green-800 dark:text-green-200'
                  : connectionStatus === 'connecting'
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {connectionStatus === 'connected' && 'Real-time Collaboration Active'}
                {connectionStatus === 'connecting' && 'Establishing Connection'}
                {connectionStatus === 'disconnected' && 'Connection Lost'}
              </h4>
              <p className={`text-sm mt-1 ${
                connectionStatus === 'connected' 
                  ? 'text-green-700 dark:text-green-300'
                  : connectionStatus === 'connecting'
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {connectionStatus === 'connected' && 
                  `Live synchronization enabled. ${teamMembers.filter(m => m.is_online).length} users collaborating.`}
                {connectionStatus === 'connecting' && 'Reconnecting to collaboration session...'}
                {connectionStatus === 'disconnected' && 'Please check your connection and try again.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};