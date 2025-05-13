// supabase/functions/quickbooks-auth/index.ts
import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';
import { OAuthClient } from 'https://esm.sh/intuit-oauth@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const QB_CLIENT_ID = Deno.env.get('QB_CLIENT_ID') || '';
const QB_CLIENT_SECRET = Deno.env.get('QB_CLIENT_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

const oauthClient = new OAuthClient({
  clientId: QB_CLIENT_ID,
  clientSecret: QB_CLIENT_SECRET,
  environment: 'sandbox', // Use 'production' for production
  redirectUri: '', // This will be set dynamically
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    const requestData = await req.json();
    const { action } = requestData;

    // Handle authorization request
    if (action === 'authorize') {
      const { redirectUri, userId } = requestData;

      if (!redirectUri || !userId) {
        return new Response(JSON.stringify({ error: 'Redirect URI and User ID are required' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      oauthClient.redirectUri = redirectUri;
      const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId, OAuthClient.scopes.Email],
        state: userId,
      });

      return new Response(JSON.stringify({ authUrl: authUri }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Handle callback from QuickBooks
    if (action === 'callback') {
      const { code, realmId, state: userId, redirectUri } = requestData;

      if (!code || !realmId || !userId || !redirectUri) {
        return new Response(JSON.stringify({ error: 'Code, Realm ID, User ID, and Redirect URI are required' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      oauthClient.redirectUri = redirectUri;

      try {
        const tokenResponse = await oauthClient.createToken(code);
        const { token } = tokenResponse.getJson();

        // Calculate the expiry date
        const now = new Date();
        const expiresInSeconds = token.expires_in;
        const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000).toISOString();

        // Fetch company info
        oauthClient.setToken(token);
        const companyInfoResponse = await oauthClient.getCompanyInfo(realmId);
        const companyInfo = companyInfoResponse.getJson();
        const companyName = companyInfo.CompanyInfo.CompanyName;

        // Save tokens and realmId to Supabase
        const { data, error } = await supabase.from('quickbooks_connections').insert({
          user_id: userId,
          realm_id: realmId,
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_at: expiresAt,
          company_name: companyName,
        });

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: corsHeaders,
        });
      } catch (e) {
        console.error('Error during token creation or saving:', e);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // Handle token refresh
    if (action === "refresh") {
      const { refreshToken, userId } = requestData;
      
      if (!refreshToken || !userId) {
        return new Response(JSON.stringify({ error: "Refresh token and User ID are required" }), {
          status: 400,
          headers: corsHeaders
        });
      }
      
      try {
        // Create a new OAuth client for refresh
        const refreshClient = new OAuthClient({
          clientId: QB_CLIENT_ID,
          clientSecret: QB_CLIENT_SECRET,
          environment: 'sandbox', // Use 'production' for production
          redirectUri: '', // Not needed for refresh
        });
        
        // Set the refresh token
        refreshClient.setToken({
          refresh_token: refreshToken
        });
        
        // Refresh the token
        const refreshResponse = await refreshClient.refresh();
        const { token } = refreshResponse.getJson();
        
        // Calculate the new expiry date
        const now = new Date();
        const expiresInSeconds = token.expires_in;
        const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000).toISOString();
        
        // Update the tokens in Supabase
        const { data, error } = await supabase
          .from('quickbooks_connections')
          .update({
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            expires_at: expiresAt
          })
          .eq('user_id', userId)
          .select();
        
        if (error) {
          throw error;
        }
        
        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        console.error("Error refreshing token:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Handle token revocation
    if (action === "revoke") {
      const { token } = requestData;
      
      if (!token) {
        return new Response(JSON.stringify({ error: "Token is required for revocation" }), {
          status: 400,
          headers: corsHeaders
        });
      }
      
      try {
        // Call Intuit's token revocation endpoint
        const authHeader = `Basic ${btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`)}`;
        const revokeResponse = await fetch(`https://developer.api.intuit.com/v2/oauth2/tokens/revoke`, {
          method: "POST",
          headers: {
            ...corsHeaders,
            "Authorization": authHeader,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ token })
        });
        
        if (!revokeResponse.ok) {
          const errorData = await revokeResponse.json();
          throw new Error(`Token revocation failed: ${JSON.stringify(errorData)}`);
        }
        
        return new Response(JSON.stringify({ success: true, message: "Token successfully revoked" }), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        console.error("Error revoking token:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // If no action is matched
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
