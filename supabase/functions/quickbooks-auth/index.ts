// supabase/functions/quickbooks-auth/index.ts
import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';
import { OAuthClient } from 'https://esm.sh/intuit-oauth@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const QUICKBOOKS_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QUICKBOOKS_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QUICKBOOKS_REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';
const QUICKBOOKS_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID') || '';
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const APP_URL = Deno.env.get('APP_URL') || 'https://preview--transync-flow-pro.lovable.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('QuickBooks auth edge function called');
  console.log('Environment variables available:', {
    QB_CLIENT_ID_EXISTS: !!QUICKBOOKS_CLIENT_ID,
    QB_CLIENT_SECRET_EXISTS: !!QUICKBOOKS_CLIENT_SECRET,
    SUPABASE_URL_EXISTS: !!SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY_EXISTS: !!SUPABASE_SERVICE_ROLE_KEY,
  });

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // Not all requests have a body
    }
    const action = body.action;
    console.log('QuickBooks Edge Function invoked. Action:', action, ', Body:', body);

    // Step 1: Generate authorization URL
    if (action === 'authorize') {
      const state = crypto.randomUUID();
      const redirectUri = body.redirectUri || `${APP_URL}/dashboard/quickbooks-callback`;
      const scopes = body.scopes || 'com.intuit.quickbooks.accounting';
      const authorizationUrl = new URL(QUICKBOOKS_AUTH_URL);
      authorizationUrl.searchParams.append('client_id', QUICKBOOKS_CLIENT_ID);
      authorizationUrl.searchParams.append('response_type', 'code');
      authorizationUrl.searchParams.append('scope', scopes);
      authorizationUrl.searchParams.append('redirect_uri', redirectUri);
      authorizationUrl.searchParams.append('state', state);
      // Add any additional params
      if (body.searchParams) {
        for (const [key, value] of Object.entries(body.searchParams)) {
          if (value) authorizationUrl.searchParams.append(key, value as string);
        }
      }
      console.log('Generated QuickBooks OAuth URL:', authorizationUrl.toString());
      return new Response(JSON.stringify({ authUrl: authorizationUrl.toString(), state }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Handle callback from QuickBooks
    if (action === 'callback') {
      console.log('Processing callback action');
      const { code, realmId, state: userId, redirectUri } = body;
      console.log('Callback parameters:', { code: !!code, realmId, userId, redirectUri });

      if (!code || !realmId || !userId || !redirectUri) {
        console.error('Missing required parameters:', {
          codeExists: !!code,
          realmIdExists: !!realmId,
          userIdExists: !!userId,
          redirectUriExists: !!redirectUri,
        });
        return new Response(JSON.stringify({ error: 'Code, Realm ID, User ID, and Redirect URI are required' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Create a new OAuth client with the provided redirect URI
      const oauthClient = new OAuthClient({
        clientId: QUICKBOOKS_CLIENT_ID,
        clientSecret: QUICKBOOKS_CLIENT_SECRET,
        environment: 'sandbox', // Use 'production' for production
        redirectUri: redirectUri,
      });

      try {
        console.log('Creating OAuth client with:', {
          clientIdLength: QUICKBOOKS_CLIENT_ID.length,
          clientSecretLength: QUICKBOOKS_CLIENT_SECRET.length,
          redirectUri,
        });

        // Exchange the authorization code for tokens
        console.log('Exchanging authorization code for tokens...');
        const tokenResponse = await oauthClient.createToken(code);
        console.log('Token response received');
        const tokenData = tokenResponse.getJson();
        console.log('Token extracted:', {
          accessTokenExists: !!tokenData.access_token,
          refreshTokenExists: !!tokenData.refresh_token,
        });

        // Calculate the expiry date
        const now = new Date();
        const expiresInSeconds = tokenData.expires_in;
        const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000).toISOString();

        // Fetch company info
        oauthClient.setToken(tokenData);
        const companyInfoResponse = await oauthClient.getCompanyInfo(realmId);
        const companyInfo = companyInfoResponse.getJson();
        const companyName = companyInfo.CompanyInfo?.CompanyName || null;

        // Store tokens in the database
        const { data: connectionData, error: connectionError } = await supabase
          .from('quickbooks_connections')
          .upsert({
            user_id: userId,
            realm_id: tokenData.realmId || realmId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_type: tokenData.token_type,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          })
          .select();
        if (connectionError) {
          console.error('Error storing tokens:', connectionError);
        }

        return new Response(JSON.stringify({ success: true, data: connectionData }), {
          status: 200,
          headers: corsHeaders,
        });
      } catch (e) {
        console.error('Error during token creation or saving:', e);
        console.error('Error details:', JSON.stringify(e, Object.getOwnPropertyNames(e)));
        return new Response(JSON.stringify({ error: e.message, details: JSON.stringify(e, Object.getOwnPropertyNames(e)) }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // Handle token refresh
    if (action === 'refresh') {
      const { refreshToken, userId } = body;

      if (!refreshToken || !userId) {
        return new Response(JSON.stringify({ error: 'Refresh token and User ID are required' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      try {
        // Create a new OAuth client for refresh
        const refreshClient = new OAuthClient({
          clientId: QUICKBOOKS_CLIENT_ID,
          clientSecret: QUICKBOOKS_CLIENT_SECRET,
          environment: 'sandbox', // Use 'production' for production
          redirectUri: '', // Not needed for refresh
        });

        // Set the refresh token
        refreshClient.setToken({
          refresh_token: refreshToken,
        });

        // Refresh the token
        const refreshResponse = await refreshClient.refresh();
        const tokenData = refreshResponse.getJson();

        // Calculate the new expiry date
        const now = new Date();
        const expiresInSeconds = tokenData.expires_in;
        const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000).toISOString();

        // Update the tokens in Supabase
        const { data, error } = await supabase
          .from('quickbooks_connections')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt,
          })
          .eq('user_id', userId)
          .select();

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: corsHeaders,
        });
      } catch (error) {
        console.error('Error refreshing token:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // Handle token revocation
    if (action === 'revoke') {
      const { token } = body;

      if (!token) {
        return new Response(JSON.stringify({ error: 'Token is required for revocation' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      try {
        // Call Intuit's token revocation endpoint
        const authHeader = `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`;
        const revokeResponse = await fetch(`${QUICKBOOKS_REVOKE_URL}`, {
          method: 'POST',
          headers: {
            ...corsHeaders,
            Authorization: authHeader,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!revokeResponse.ok) {
          const errorData = await revokeResponse.json();
          throw new Error(`Token revocation failed: ${JSON.stringify(errorData)}`);
        }

        return new Response(JSON.stringify({ success: true, message: 'Token successfully revoked' }), {
          status: 200,
          headers: corsHeaders,
        });
      } catch (error) {
        console.error('Error revoking token:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // If no action is matched
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error && error.message ? error.message : String(error) }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
