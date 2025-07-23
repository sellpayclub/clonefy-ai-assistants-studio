import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, ...data } = await req.json();

    console.log(`Google Calendar Auth - Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'get_auth_url':
        return await getAuthUrl(user.id, data);
      case 'handle_callback':
        return await handleCallback(user.id, data);
      case 'disconnect':
        return await disconnectCalendar(user.id, data);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getAuthUrl(userId: string, data: any) {
  const { assistant_id } = data;
  
  // Google OAuth2 settings
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/google-calendar-auth';
  
  if (!clientId) {
    return new Response(
      JSON.stringify({ error: 'Google Calendar não configurado. Contacte o administrador.' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ].join(' ');

  const state = btoa(JSON.stringify({ userId, assistant_id }));

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${state}`;

  return new Response(
    JSON.stringify({ auth_url: authUrl }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleCallback(userId: string, data: any) {
  const { code, state } = data;
  
  const stateData = JSON.parse(atob(state));
  if (stateData.userId !== userId) {
    return new Response(
      JSON.stringify({ error: 'Invalid state parameter' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/google-calendar-auth';

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  const tokens = await tokenResponse.json();
  
  if (!tokens.access_token) {
    return new Response(
      JSON.stringify({ error: 'Failed to get access token' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Get calendar list
  const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendar/list', {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
    },
  });

  const calendars = await calendarResponse.json();
  const primaryCalendar = calendars.items?.find((cal: any) => cal.primary) || calendars.items?.[0];

  if (!primaryCalendar) {
    return new Response(
      JSON.stringify({ error: 'No calendar found' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Save integration to database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const expiresAt = tokens.expires_in ? 
    new Date(Date.now() + tokens.expires_in * 1000).toISOString() : 
    null;

  const { error } = await supabase
    .from('calendar_integrations')
    .upsert({
      user_id: userId,
      assistant_id: stateData.assistant_id,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      calendar_id: primaryCalendar.id,
      calendar_name: primaryCalendar.summary,
      is_active: true,
      sync_enabled: true,
    }, {
      onConflict: 'user_id,assistant_id,provider'
    });

  if (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save integration' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      calendar_name: primaryCalendar.summary 
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function disconnectCalendar(userId: string, data: any) {
  const { assistant_id } = data;
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { error } = await supabase
    .from('calendar_integrations')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('assistant_id', assistant_id)
    .eq('provider', 'google');

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to disconnect' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}