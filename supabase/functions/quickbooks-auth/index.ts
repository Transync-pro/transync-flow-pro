
// supabase/functions/quickbooks-auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { OAuthClient } from 'npm:intuit-oauth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const QB_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID') || '';
const QB_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const QB_ENVIRONMENT = Deno.env.get('QUICKBOOKS_ENVIRONMENT') || 'sandbox';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with auth header from the request
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      // Handle requests without body
      const url = new URL(req.url);
      const path = url.pathname.split('/').pop();
      body = { path };
    }

    console.log('Request body:', JSON.stringify(body));
    
    // Initialize OAuth client
    const oauthClient = new OAuthClient({
      clientId: QB_CLIENT_ID,
      clientSecret: QB_CLIENT_SECRET,
      environment: QB_ENVIRONMENT,
      redirectUri: body.redirectUri || '',
    });

    // Handle authorization request (start OAuth flow)
    if (body.path === 'authorize') {
      const { userId, redirectUri } = body;
      
      if (!userId || !redirectUri) {
        return new Response(
          JSON.stringify({ error: 'User ID and redirect URI are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      oauthClient.redirectUri = redirectUri;
      
      // Generate the authorization URL with appropriate scopes
      const authUri = oauthClient.authorizeUri({
        scope: [
          OAuthClient.scopes.Accounting,
          OAuthClient.scopes.OpenId,
          OAuthClient.scopes.Email,
        ],
        state: userId,
      });

      console.log('Generated auth URL:', authUri);
      
      // Return the URL for frontend redirection
      return new Response(
        JSON.stringify({ authUrl: authUri }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    
    // Handle token exchange (callback from QuickBooks authorization)
    if (body.path === 'token') {
      const { code, redirectUri, userId } = body;

      if (!code || !redirectUri || !userId) {
        return new Response(
          JSON.stringify({ error: 'Code, redirect URI, and user ID are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Processing token exchange:', { code, redirectUri, userId });

      oauthClient.redirectUri = redirectUri;

      try {
        // Exchange authorization code for tokens
        const tokenResponse = await oauthClient.createToken(code);
        const tokenJson = tokenResponse.getJson();

        console.log('Token response received');

        // Calculate token expiry time
        const now = new Date();
        const expiresInSeconds = tokenJson.token.expires_in;
        const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000).toISOString();

        // Extract realm ID from token response
        const realmId = tokenResponse.token.realmid;

        // Fetch company information
        oauthClient.setToken(tokenJson.token);
        const companyInfoResponse = await oauthClient.getCompanyInfo(realmId);
        const companyInfo = companyInfoResponse.getJson();
        
        // Extract company name or use a default
        const companyName = companyInfo?.CompanyInfo?.CompanyName || 'QuickBooks Company';

        console.log('Company info received:', companyName);

        // Save connection details to database
        const { data, error: dbError } = await supabase
          .from('quickbooks_connections')
          .upsert(
            {
              user_id: userId,
              realm_id: realmId,
              access_token: tokenJson.token.access_token,
              refresh_token: tokenJson.token.refresh_token,
              expires_at: expiresAt,
              company_name: companyName,
            },
            { onConflict: 'user_id' }
          );

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error(`Failed to save QuickBooks connection: ${dbError.message}`);
        }

        // Log the successful connection
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

        return new Response(
          JSON.stringify({ 
            success: true,
            realmId,
            companyName,
            expiresAt
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Token exchange error:', error);
        
        // Log the failed connection attempt
        await supabase.from('operation_logs').insert({
          user_id: userId,
          operation_type: 'connection',
          entity_type: 'quickbooks',
          status: 'error',
          details: {
            error: error.message || 'Unknown error during token exchange'
          }
        });

        return new Response(
          JSON.stringify({ error: error.message || 'Token exchange failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle token refresh
    if (body.path === 'refresh') {
      const { userId, refreshToken } = body;
      
      if (!userId || !refreshToken) {
        return new Response(
          JSON.stringify({ error: 'User ID and refresh token are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Set the refresh token
        oauthClient.token = {
          refresh_token: refreshToken
        };

        // Refresh the access token
        const refreshResponse = await oauthClient.refresh();
        const refreshJson = refreshResponse.getJson();
        
        // Calculate new expiry time
        const now = new Date();
        const expiresInSeconds = refreshJson.token.expires_in;
        const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000).toISOString();

        // Update tokens in database
        const { error: dbError } = await supabase
          .from('quickbooks_connections')
          .update({
            access_token: refreshJson.token.access_token,
            refresh_token: refreshJson.token.refresh_token,
            expires_at: expiresAt,
          })
          .eq('user_id', userId);

        if (dbError) {
          throw new Error(`Failed to update tokens: ${dbError.message}`);
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            accessToken: refreshJson.token.access_token,
            refreshToken: refreshJson.token.refresh_token,
            expiresAt
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Token refresh error:', error);
        
        return new Response(
          JSON.stringify({ error: error.message || 'Token refresh failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle token revocation
    if (body.path === 'revoke') {
      const { userId } = body;
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Get current connection
        const { data: connection, error: fetchError } = await supabase
          .from('quickbooks_connections')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (fetchError || !connection) {
          throw new Error('No active QuickBooks connection found');
        }
        
        // Set the token to revoke
        oauthClient.token = {
          access_token: connection.access_token,
          refresh_token: connection.refresh_token,
        };
        
        // Revoke the token
        await oauthClient.revoke();
        
        // Delete the connection from the database
        const { error: deleteError } = await supabase
          .from('quickbooks_connections')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) {
          throw new Error(`Failed to delete connection: ${deleteError.message}`);
        }
        
        // Log the disconnection
        await supabase.from('operation_logs').insert({
          user_id: userId,
          operation_type: 'disconnection',
          entity_type: 'quickbooks',
          record_id: connection.realm_id,
          status: 'success',
        });
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Revocation error:', error);
        
        return new Response(
          JSON.stringify({ error: error.message || 'Revocation failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If no valid path was specified
    return new Response(
      JSON.stringify({ error: 'Invalid path. Use "authorize", "token", "refresh", or "revoke"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
