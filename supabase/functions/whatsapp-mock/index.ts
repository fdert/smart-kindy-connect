import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.json();
    console.log('WhatsApp Mock - Received message:', {
      to: body.phone || body.to,
      message: body.message || body.text?.body,
      tenantId: body.tenant_id,
      contextType: body.context_type,
      timestamp: body.timestamp
    });

    // محاكاة نجاح الإرسال
    const mockResponse = {
      success: true,
      messageId: `mock_${Date.now()}`,
      status: "sent",
      messages: [{
        id: `wamid.mock_${Date.now()}`
      }]
    };

    console.log('WhatsApp Mock - Simulated successful send:', mockResponse);

    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WhatsApp Mock Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Mock service error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});