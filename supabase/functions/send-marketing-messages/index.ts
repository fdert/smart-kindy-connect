import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMarketingRequest {
  campaignId: string;
}

const MAX_MESSAGE_CHARS = 600;

// Split long messages into safe chunks (tries to split on word boundaries)
function splitMessage(content: string, limit: number = MAX_MESSAGE_CHARS): string[] {
  if (!content) return [''];
  const chunks: string[] = [];
  let remaining = content.trim();
  while (remaining.length > limit) {
    let cut = remaining.lastIndexOf(' ', limit);
    if (cut === -1 || cut < limit * 0.6) cut = limit; // fallback if no space nearby
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining.length) chunks.push(remaining);
  return chunks;
}

// Basic E.164 phone normalization focused on KSA numbers, but keeps existing E.164
function normalizePhone(phone: string): string {
  if (!phone) return '';
  let p = phone.replace(/\s|-/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (p.startsWith('+')) return p;
  // KSA-specific normalizations
  if (p.startsWith('05')) return '+966' + p.slice(1);
  if (p.startsWith('5') && p.length === 9) return '+966' + p;
  if (p.startsWith('966')) return '+' + p;
  // Fallback: prefix with + if looks like international
  if (/^\d{8,15}$/.test(p)) return '+' + p;
  return p;
}

function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
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

    const rawPhoneNumbers = Array.isArray(campaign.phone_numbers) ? campaign.phone_numbers : [];
    const normalizedPhones = Array.from(new Set(
      rawPhoneNumbers.map(normalizePhone).filter(isValidE164)
    ));

    console.log(`Starting to send ${normalizedPhones.length} messages`);

    // Ensure message logs exist (create only if none)
    const { count: existingLogsCount, error: logsCountError } = await supabase
      .from('marketing_message_logs')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);
    if (logsCountError) {
      console.error('Error checking existing logs:', logsCountError);
    }
    if (!existingLogsCount || existingLogsCount === 0) {
      const messageLogs = normalizedPhones.map(phone => ({
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
          const normalized = normalizePhone(phone);
          if (!isValidE164(normalized)) {
            await supabase
              .from('marketing_message_logs')
              .update({ status: 'failed', error_message: 'Invalid recipient phone format' })
              .eq('campaign_id', campaignId)
              .eq('recipient_phone', phone);
            console.warn(`Invalid phone skipped: ${phone}`);
            continue;
          }

          try {
            const parts = splitMessage(campaign.message_content || '');
            let allOk = true;
            let lastErrText = '';

            for (let i = 0; i < parts.length; i++) {
              const payload = {
                to: normalized,
                message: parts[i],
                campaign_id: campaignId,
                campaign_name: campaign.campaign_name,
                timestamp: new Date().toISOString(),
                webhook_secret: campaign.webhook_secret,
                message_part: i + 1,
                message_total: parts.length
              };

              console.log(`Sending message${parts.length > 1 ? ` part ${i + 1}/${parts.length}` : ''} to ${normalized}`);

              const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (!response.ok) {
                lastErrText = await response.text();
                console.error(`Failed to send${parts.length > 1 ? ` part ${i + 1}` : ''} to ${normalized}:`, lastErrText);
                allOk = false;
                break;
              }

              // tiny gap between parts to avoid provider throttling
              if (parts.length > 1) {
                await new Promise(res => setTimeout(res, 150));
              }
            }

            if (allOk) {
              await supabase
                .from('marketing_message_logs')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('campaign_id', campaignId)
                .eq('recipient_phone', phone);
              console.log(`Message sent successfully to ${normalized}${parts.length > 1 ? ` in ${parts.length} parts` : ''}`);
            } else {
              await supabase
                .from('marketing_message_logs')
                .update({ status: 'failed', error_message: lastErrText || 'Webhook request failed' })
                .eq('campaign_id', campaignId)
                .eq('recipient_phone', phone);
            }
          } catch (error: any) {
            console.error(`Error sending message to ${normalized}:`, error.message);
            await supabase
              .from('marketing_message_logs')
              .update({ status: 'failed', error_message: error.message || 'Network error' })
              .eq('campaign_id', campaignId)
              .eq('recipient_phone', phone);
          }

          // Delay per configured settings (between recipients)
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
      totalRecipients: (typeof normalizedPhones !== 'undefined' ? normalizedPhones.length : 0)
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