-- Create connection_requests table for managing user connection requests
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable RLS
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- Policies for connection_requests
CREATE POLICY "Users can view their own requests"
  ON public.connection_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create connection requests"
  ON public.connection_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update requests they received"
  ON public.connection_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Create online_users table for tracking live users
CREATE TABLE IF NOT EXISTS public.online_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_available BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

-- Policies for online_users
CREATE POLICY "Anyone can view online users"
  ON public.online_users FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own status"
  ON public.online_users FOR ALL
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at on connection_requests
CREATE TRIGGER update_connection_requests_updated_at
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_users;