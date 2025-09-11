import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMarketingRequest {
  campaignId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { campaignId }: SendMarketingRequest = await req.json();

    if (!campaignId) {
      return new Response(JSON.stringify({ error: 'Campaign ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing marketing campaign:', campaignId);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError);
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['draft', 'sending'].includes(campaign.status)) {
      return new Response(JSON.stringify({ error: 'Campaign cannot be sent in current status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update campaign status to sending if starting from draft
    if (campaign.status === 'draft') {
      await supabase
        .from('marketing_campaigns')
        .update({ 
          status: 'sending',
          started_at: new Date().toISOString()
        })
        .eq('id', campaignId);
    }

    const phoneNumbers = Array.isArray(campaign.phone_numbers) ? campaign.phone_numbers : [];

    console.log(`Starting to send ${phoneNumbers.length} messages`);

    // Ensure message logs exist (create only if none)
    const { count: existingLogsCount, error: logsCountError } = await supabase
      .from('marketing_message_logs')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);
    if (logsCountError) {
      console.error('Error checking existing logs:', logsCountError);
    }
    if (!existingLogsCount || existingLogsCount === 0) {
      const messageLogs = phoneNumbers.map(phone => ({
        campaign_id: campaignId,
        recipient_phone: phone,
        status: 'pending'
      }));
      const { error: logError } = await supabase
        .from('marketing_message_logs')
        .insert(messageLogs);
      if (logError) {
        console.error('Error creating message logs:', logError);
      }
    }

    // Calculate delay settings
    const baseDelay = campaign.message_delay_seconds || 10;
    const useRandomDelay = campaign.use_random_delay || false;
    
    console.log(`Using delay settings: base=${baseDelay}s, random=${useRandomDelay}`);

    // Background batch processing with immediate response
    const processBatch = async () => {
      try {
        const MAX_RUNTIME_SECONDS = 100;
        const batchSize = Math.max(1, Math.floor(MAX_RUNTIME_SECONDS / Math.max(1, baseDelay)));

        // Fetch pending logs for this campaign
        const { data: pendingLogs, error: pendingError } = await supabase
          .from('marketing_message_logs')
          .select('recipient_phone')
          .eq('campaign_id', campaignId)
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(batchSize);

        if (pendingError) {
          console.error('Error fetching pending logs:', pendingError);
          return;
        }

        const phonesToSend = (pendingLogs || []).map(l => l.recipient_phone);
        console.log(`Processing batch of ${phonesToSend.length} recipients (batchSize=${batchSize})`);

        const webhookUrl = campaign.webhook_url || 'https://hook.eu2.make.com/default-webhook-url';

        for (const phone of phonesToSend) {
          try {
            const payload = {
              to: phone,
              message: campaign.message_content,
              campaign_id: campaignId,
              campaign_name: campaign.campaign_name,
              timestamp: new Date().toISOString(),
              webhook_secret: campaign.webhook_secret
            };

            console.log(`Sending message to ${phone}`);

            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              await supabase
                .from('marketing_message_logs')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('campaign_id', campaignId)
                .eq('recipient_phone', phone);
              console.log(`Message sent successfully to ${phone}`);
            } else {
              const errorText = await response.text();
              console.error(`Failed to send message to ${phone}:`, errorText);
              await supabase
                .from('marketing_message_logs')
                .update({ status: 'failed', error_message: errorText || 'Webhook request failed' })
                .eq('campaign_id', campaignId)
                .eq('recipient_phone', phone);
            }
          } catch (error: any) {
            console.error(`Error sending message to ${phone}:`, error.message);
            await supabase
              .from('marketing_message_logs')
              .update({ status: 'failed', error_message: error.message || 'Network error' })
              .eq('campaign_id', campaignId)
              .eq('recipient_phone', phone);
          }

          // Delay per configured settings
          let delayMs;
          if (useRandomDelay) {
            const minDelay = Math.max(1, baseDelay - 3);
            const maxDelay = baseDelay + 3;
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            delayMs = randomDelay * 1000;
            console.log(`Using random delay: ${randomDelay}s`);
          } else {
            delayMs = baseDelay * 1000;
            console.log(`Using fixed delay: ${baseDelay}s`);
          }
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Update progress and decide next steps
        const { count: pendingCount } = await supabase
          .from('marketing_message_logs')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'pending');

        const { count: totalSent } = await supabase
          .from('marketing_message_logs')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'sent');

        const { count: totalFailed } = await supabase
          .from('marketing_message_logs')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .eq('status', 'failed');

        await supabase
          .from('marketing_campaigns')
          .update({ sent_count: totalSent || 0, failed_count: totalFailed || 0 })
          .eq('id', campaignId);

        if (!pendingCount || pendingCount === 0) {
          const finalStatus = (totalFailed || 0) > 0 && (totalSent || 0) === 0 ? 'failed' : 'completed';
          await supabase
            .from('marketing_campaigns')
            .update({ status: finalStatus, completed_at: new Date().toISOString() })
            .eq('id', campaignId);
          console.log(`Campaign completed: ${totalSent || 0} sent, ${totalFailed || 0} failed`);
        } else {
          console.log(`Pending messages remaining: ${pendingCount}. Queuing next batch...`);
          const invokeRes = await supabase.functions.invoke('send-marketing-messages', { body: { campaignId } });
          if (invokeRes.error) {
            console.error('Error invoking next batch:', invokeRes.error);
          }
        }
      } catch (e: any) {
        console.error('Background processing error:', e?.message || e);
      }
    };

    // Queue background task and respond immediately
    const edge = (globalThis as any).EdgeRuntime;
    if (edge && typeof edge.waitUntil === 'function') {
      edge.waitUntil(processBatch());
    } else {
      // Fallback: start without awaiting
      processBatch();
    }

    return new Response(JSON.stringify({ 
      success: true,
      accepted: true,
      campaignId,
      status: 'sending',
      sentCount: 0,
      failedCount: 0,
      totalRecipients: phoneNumbers.length
    }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in marketing messages function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});