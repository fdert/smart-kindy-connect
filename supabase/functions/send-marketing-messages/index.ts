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

    if (campaign.status !== 'draft') {
      return new Response(JSON.stringify({ error: 'Campaign is not in draft status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update campaign status to sending
    await supabase
      .from('marketing_campaigns')
      .update({ 
        status: 'sending',
        started_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    const phoneNumbers = Array.isArray(campaign.phone_numbers) ? campaign.phone_numbers : [];
    let sentCount = 0;
    let failedCount = 0;

    console.log(`Starting to send ${phoneNumbers.length} messages`);

    // Create message logs for tracking
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

    // Send messages sequentially to avoid overwhelming the webhook
    for (const phone of phoneNumbers) {
      try {
        const webhookUrl = campaign.webhook_url || 'https://hook.eu2.make.com/default-webhook-url';
        
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          sentCount++;
          // Update message log as sent
          await supabase
            .from('marketing_message_logs')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('campaign_id', campaignId)
            .eq('recipient_phone', phone);

          console.log(`Message sent successfully to ${phone}`);
        } else {
          failedCount++;
          const errorText = await response.text();
          console.error(`Failed to send message to ${phone}:`, errorText);
          
          // Update message log as failed
          await supabase
            .from('marketing_message_logs')
            .update({ 
              status: 'failed',
              error_message: errorText || 'Webhook request failed'
            })
            .eq('campaign_id', campaignId)
            .eq('recipient_phone', phone);
        }

        // Add small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        failedCount++;
        console.error(`Error sending message to ${phone}:`, error.message);
        
        // Update message log as failed
        await supabase
          .from('marketing_message_logs')
          .update({ 
            status: 'failed',
            error_message: error.message || 'Network error'
          })
          .eq('campaign_id', campaignId)
          .eq('recipient_phone', phone);
      }
    }

    // Update campaign with final results
    const finalStatus = failedCount === phoneNumbers.length ? 'failed' : 'completed';
    
    await supabase
      .from('marketing_campaigns')
      .update({ 
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    console.log(`Campaign completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(JSON.stringify({ 
      success: true,
      campaignId,
      sentCount,
      failedCount,
      totalRecipients: phoneNumbers.length,
      status: finalStatus
    }), {
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