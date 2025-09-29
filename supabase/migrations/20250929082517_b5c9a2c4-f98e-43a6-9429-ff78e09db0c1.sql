-- Enable authentication
-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user'::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonymous User'));
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create team_chat table for collaboration chat
CREATE TABLE IF NOT EXISTS public.team_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'notification')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on team_chat
ALTER TABLE public.team_chat ENABLE ROW LEVEL SECURITY;

-- Create policies for team_chat
CREATE POLICY "Members can view chat in their rooms" ON public.team_chat
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM public.room_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages in their rooms" ON public.team_chat
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    room_id IN (
      SELECT room_id FROM public.room_members 
      WHERE user_id = auth.uid()
    )
  );

-- Enable realtime for team_chat
ALTER TABLE public.team_chat REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_chat;

-- Create connection_notifications table
CREATE TABLE IF NOT EXISTS public.connection_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('joined', 'left', 'connected', 'disconnected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on connection_notifications
ALTER TABLE public.connection_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for connection_notifications
CREATE POLICY "Members can view notifications in their rooms" ON public.connection_notifications
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM public.room_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create notifications" ON public.connection_notifications
  FOR INSERT WITH CHECK (true);

-- Enable realtime for connection_notifications
ALTER TABLE public.connection_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_notifications;

-- Create local_saves table for auto-save functionality
CREATE TABLE IF NOT EXISTS public.local_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  is_auto_save BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on local_saves
ALTER TABLE public.local_saves ENABLE ROW LEVEL SECURITY;

-- Create policies for local_saves
CREATE POLICY "Users can manage their own saves" ON public.local_saves
  FOR ALL USING (user_id = auth.uid());

-- Create trigger for local_saves updated_at
CREATE TRIGGER update_local_saves_updated_at
  BEFORE UPDATE ON public.local_saves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing tables to add missing indexes
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_file_changes_room_id ON public.file_changes(room_id);
CREATE INDEX IF NOT EXISTS idx_file_changes_user_id ON public.file_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_room_id ON public.team_chat(room_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_created_at ON public.team_chat(created_at);
CREATE INDEX IF NOT EXISTS idx_connection_notifications_room_id ON public.connection_notifications(room_id);
CREATE INDEX IF NOT EXISTS idx_local_saves_room_user ON public.local_saves(room_id, user_id);