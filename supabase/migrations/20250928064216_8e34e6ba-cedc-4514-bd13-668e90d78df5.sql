-- Create collaboration rooms table
CREATE TABLE public.collaboration_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Collaboration Session',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room members table
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host', 'guest')),
  display_name TEXT NOT NULL,
  is_online BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{"canEdit": true, "canDelete": false, "canExport": false, "canViewYouTube": false}',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create file changes log table
CREATE TABLE public.file_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.collaboration_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_rooms
CREATE POLICY "Users can view rooms they are members of" 
ON public.collaboration_rooms 
FOR SELECT 
USING (
  id IN (
    SELECT room_id FROM public.room_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create rooms" 
ON public.collaboration_rooms 
FOR INSERT 
WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update their rooms" 
ON public.collaboration_rooms 
FOR UPDATE 
USING (host_id = auth.uid());

-- RLS Policies for room_members
CREATE POLICY "Members can view other members in same room" 
ON public.room_members 
FOR SELECT 
USING (
  room_id IN (
    SELECT room_id FROM public.room_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can join rooms" 
ON public.room_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own membership" 
ON public.room_members 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Hosts can manage room members" 
ON public.room_members 
FOR ALL 
USING (
  room_id IN (
    SELECT id FROM public.collaboration_rooms 
    WHERE host_id = auth.uid()
  )
);

-- RLS Policies for file_changes
CREATE POLICY "Members can view file changes in their rooms" 
ON public.file_changes 
FOR SELECT 
USING (
  room_id IN (
    SELECT room_id FROM public.room_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can create file changes in their rooms" 
ON public.file_changes 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  room_id IN (
    SELECT room_id FROM public.room_members 
    WHERE user_id = auth.uid()
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_collaboration_rooms_updated_at
BEFORE UPDATE ON public.collaboration_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tables
ALTER TABLE public.collaboration_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_members REPLICA IDENTITY FULL;
ALTER TABLE public.file_changes REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_changes;