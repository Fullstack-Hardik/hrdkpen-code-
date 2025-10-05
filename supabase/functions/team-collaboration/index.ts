import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case 'sync_code': {
        const { roomId, filePath, content, userId } = params;
        
        // Broadcast code changes to all room members
        const { error } = await supabaseClient
          .from('file_changes')
          .insert({
            room_id: roomId,
            user_id: userId,
            file_path: filePath,
            content: content,
            change_type: 'update',
            description: 'Code synchronized'
          });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_room_state': {
        const { roomId } = params;
        
        // Get latest state of all files in room
        const { data: fileChanges, error } = await supabaseClient
          .from('file_changes')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by file_path and get latest for each file
        const latestFiles = fileChanges?.reduce((acc: any, change: any) => {
          if (!acc[change.file_path]) {
            acc[change.file_path] = change;
          }
          return acc;
        }, {});

        return new Response(
          JSON.stringify({ files: Object.values(latestFiles || {}) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_presence': {
        const { roomId, isOnline } = params;
        
        const { error } = await supabaseClient
          .from('room_members')
          .update({ 
            is_online: isOnline,
            last_seen: new Date().toISOString()
          })
          .eq('room_id', roomId)
          .eq('user_id', user.id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
