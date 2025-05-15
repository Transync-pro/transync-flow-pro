// supabase/functions/quickbooks-auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};
const QB_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID') || '';
const QB_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const QB_ENVIRONMENT = Deno.env.get('QUICKBOOKS_ENVIRONMENT') || 'production';
const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";
const QB_API_URL = "https://quickbooks.api.intuit.com";
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Use Service Role Key for all DB ops!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    let body;
    try {
      body = await req.json();
    } catch (e) {
      const url = new URL(req.url);
      const path = url.pathname.split('/').pop();
      body = {
        path
      };
    }
    // 1. Authorize
    if (body.path === 'authorize') {
      const { userId, redirectUri } = body;
      if (!userId || !redirectUri) {
        return new Response(JSON.stringify({
          error: 'User ID and redirect URI are required'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const scopes = [
        'com.intuit.quickbooks.accounting',
        'openid',
        'profile',
        'email',
        'address',
        'phone'
      ];
      const authUrl = new URL(QB_AUTH_URL);
      authUrl.searchParams.append('client_id', QB_CLIENT_ID);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scopes.join(' '));
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('state', userId);
      return new Response(JSON.stringify({
        authUrl: authUrl.toString()
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 2. Exchange code for token
    if (body.path === 'token') {
      const { code, redirectUri, userId } = body;
      if (!code || !redirectUri || !userId) {
        return new Response(JSON.stringify({
          error: 'Code, redirect URI, and user ID are required'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      try {
        const tokenParams = new URLSearchParams();
        tokenParams.append('grant_type', 'authorization_code');
        tokenParams.append('code', code);
        tokenParams.append('redirect_uri', redirectUri);
        const authString = `${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`;
        const base64Auth = btoa(authString);
        const tokenResponse = await fetch(QB_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Auth}`,
            'Accept': 'application/json'
          },
          body: tokenParams
        });
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error || 'Unknown error'}`);
        }
        const tokenData = await tokenResponse.json();
        const now = new Date();
        const expiresInSeconds = tokenData.expires_in;
        const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000).toISOString();
        const realmId = tokenData.realmId || '';
        let companyName = 'QuickBooks Company';
        if (realmId) {
          try {
            const companyInfoUrl = `${QB_API_URL}/v3/company/${realmId}/companyinfo/${realmId}`;
            const companyResponse = await fetch(companyInfoUrl, {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json'
              }
            });
            if (companyResponse.ok) {
              const companyInfo = await companyResponse.json();
              companyName = companyInfo.CompanyInfo?.CompanyName || companyName;
            }
          } catch (companyError) {
            console.error('Error fetching company info:', companyError);
          }
        }
        const { error: dbError } = await supabase.from('quickbooks_connections').upsert({
          user_id: userId,
          realm_id: realmId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          company_name: companyName,
          token_type: tokenData.token_type || 'Bearer'
        }, {
          onConflict: 'user_id'
        });
        if (dbError) throw new Error(`Failed to save QuickBooks connection: ${dbError.message}`);
        await supabase.from('operation_logs').insert({
          user_id: userId,
          operation_type: 'connection',
          entity_type: 'quickbooks',
          record_id: realmId,
          status: 'success',
          details: {
            company_name: companyName,
            expires_at: expiresAt
          }
        });
        return new Response(JSON.stringify({
          success: true,
          realmId,
          companyName,
          expiresAt
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        await supabase.from('operation_logs').insert({
          user_id: userId,
          operation_type: 'connection',
          entity_type: 'quickbooks',
          status: 'error',
          details: {
            error: error.message || 'Unknown error during token exchange'
          }
        });
        return new Response(JSON.stringify({
          error: error.message || 'Token exchange failed'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // 3. Refresh token
    if (body.path === 'refresh') {
      const { userId, refreshToken } = body;
      if (!userId || !refreshToken) {
        return new Response(JSON.stringify({
          error: 'User ID and refresh token are required'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      try {
        const refreshParams = new URLSearchParams();
        refreshParams.append('grant_type', 'refresh_token');
        refreshParams.append('refresh_token', refreshToken);
        const authString = `${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`;
        const base64Auth = btoa(authString);
        const refreshResponse = await fetch(QB_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Auth}`,
            'Accept': 'application/json'
          },
          body: refreshParams
        });
        if (!refreshResponse.ok) {
          const errorData = await refreshResponse.json();
          throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error || 'Unknown error'}`);
        }
        const refreshData = await refreshResponse.json();
        const now = new Date();
        const expiresInSeconds = refreshData.expires_in;
        const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000).toISOString();
        const { error: dbError } = await supabase.from('quickbooks_connections').update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: expiresAt
        }).eq('user_id', userId);
        if (dbError) throw new Error(`Failed to update tokens: ${dbError.message}`);
        return new Response(JSON.stringify({
          success: true,
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token,
          expiresAt
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message || 'Token refresh failed'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // 4. Revoke/disconnect
    if (body.path === 'revoke') {
      const { userId } = body;
      if (!userId) {
        return new Response(JSON.stringify({
          error: 'User ID is required'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      try {
        const { data: connection } = await supabase.from('quickbooks_connections').select('*').eq('user_id', userId).single();
        if (!connection) {
          throw new Error('No active QuickBooks connection found');
        }
        const authString = `${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`;
        const base64Auth = btoa(authString); // ✅ Deno-compatible
        // ✅ ADD THESE LOGS
        console.log('Revoking token:', connection.refresh_token);
        console.log('Authorization header:', `Basic ${base64Auth}`);
        const revokeParams = new URLSearchParams();
        revokeParams.append('token', connection.refresh_token);
        const revokeResponse = await fetch(QB_REVOKE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Auth}`,
            'Accept': 'application/json'
          },
          body: revokeParams
        });
        const responseText = await revokeResponse.text();
        console.log('Revoke response text:', responseText);
        if (!revokeResponse.ok) {
          console.error(`QuickBooks revoke failed. Status: ${revokeResponse.status}`);
          throw new Error(`Failed to revoke QuickBooks token: ${responseText}`);
        }
        await supabase.from('quickbooks_connections').delete().eq('user_id', userId);
        await supabase.from('operation_logs').insert({
          user_id: userId,
          operation_type: 'disconnection',
          entity_type: 'quickbooks',
          record_id: connection.realm_id,
          status: 'success'
        });
        return new Response(JSON.stringify({
          success: true
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('QuickBooks revoke error:', error.message || error);
        return new Response(JSON.stringify({
          error: error.message || 'Revocation failed'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // 5. Fallback
    return new Response(JSON.stringify({
      error: 'Invalid path. Use \"authorize\", \"token\", \"refresh\", or \"revoke\"'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
