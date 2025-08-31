import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Running daily assignment reminder check...');

    // Call the PostgreSQL function to process scheduled notifications
    const { error: functionError } = await supabase.rpc('process_scheduled_notifications');

    if (functionError) {
      throw new Error(`Database function error: ${functionError.message}`);
    }

    // Also trigger the assignment-notifications function to handle any pending notifications
    const { error: notificationError } = await supabase.functions.invoke('assignment-notifications');

    if (notificationError) {
      console.warn('Warning: Assignment notifications function error:', notificationError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily assignment reminders processed successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in daily-reminders function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});