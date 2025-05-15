import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Get environment setting
const QUICKBOOKS_ENVIRONMENT = Deno.env.get('QUICKBOOKS_ENVIRONMENT') || 'sandbox';
const IS_SANDBOX = QUICKBOOKS_ENVIRONMENT === 'sandbox';

// Get the appropriate credentials based on environment
const CLIENT_ID = IS_SANDBOX 
  ? (Deno.env.get('SANDBOX_ID') || '') 
  : (Deno.env.get('QUICKBOOKS_CLIENT_ID') || '');

const CLIENT_SECRET = IS_SANDBOX 
  ? (Deno.env.get('SANDBOX_SECRET') || '') 
  : (Deno.env.get('QUICKBOOKS_CLIENT_SECRET') || '');

// Log which environment we're using
console.log(`Using QuickBooks ${QUICKBOOKS_ENVIRONMENT} environment`);
console.log(`Client ID: ${CLIENT_ID.substring(0, 5)}...`);

// Supabase credentials
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// Use the admin client to bypass RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Base URLs for different environments
const getQBApiBaseUrl = () => {
  return QUICKBOOKS_ENVIRONMENT === 'production' 
    ? 'https://quickbooks.api.intuit.com' 
    : 'https://sandbox-quickbooks.api.intuit.com';
};

const getOAuthBaseUrl = () => {
  return QUICKBOOKS_ENVIRONMENT === 'production' 
    ? 'https://appcenter.intuit.com/connect/oauth2' 
    : 'https://appcenter.intuit.com/connect/oauth2';
};

// Token URLs are the same for both environments
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const REVOKE_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/revoke';

// Save the connection to Supabase
const saveConnection = async (userId, realmId, tokenResponse)=>{
  console.log(`Saving connection for user ${userId} and realmId ${realmId}`);
  try {
    // Calculate when the token expires
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
    
    console.log('Token expires at:', expiresAt.toISOString());
    console.log('Token response contains:', Object.keys(tokenResponse).join(', '));
    
    // Check if a connection already exists for this user
    const { data: existingConnection, error: queryError } = await supabase
      .from('quickbooks_connections')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking for existing connection:', queryError);
      throw queryError;
    }
    
    let result;
    if (existingConnection) {
      console.log('Updating existing connection');
      // Update existing connection
      result = await supabase.from('quickbooks_connections').update({
        realm_id: realmId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type || 'Bearer',
        expires_at: expiresAt.toISOString(),
        company_name: tokenResponse.company_name,
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);
    } else {
      console.log('Creating new connection');
      // Create new connection
      result = await supabase.from('quickbooks_connections').insert({
        user_id: userId,
        realm_id: realmId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type || 'Bearer',
        expires_at: expiresAt.toISOString(),
        company_name: tokenResponse.company_name // May be undefined
      });
    }
    
    if (result.error) {
      console.error('Error saving connection to database:', result.error);
      throw result.error;
    }
    
    console.log('Connection saved successfully');
    return {
      success: true
    };
  } catch (error) {
    console.error('Error saving connection:', error);
    throw error;
  }
};
// Get the connection for a user
const getConnection = async (userId)=>{
  const { data, error } = await supabase.from('quickbooks_connections').select('*').eq('user_id', userId).single();
  if (error) {
    console.error('Error getting connection:', error);
    return null;
  }
  return data;
};
// Get company info from QuickBooks
const getCompanyInfo = async (accessToken, realmId)=>{
  try {
    const response = await fetch(`${getQBApiBaseUrl()}/v3/company/${realmId}/companyinfo/${realmId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to get company info: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.CompanyInfo?.CompanyName || null;
  } catch (error) {
    console.error('Error fetching company info:', error);
    return null;
  }
};
// Handle the request
serve(async (req)=>{
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }
  try {
    const { path, ...params } = await req.json();
    if (path === 'authorize') {
      const { redirectUri, userId } = params;
      if (!redirectUri || !userId) {
        throw new Error('Missing required parameters: redirectUri or userId');
      }
      // Scope: define what your app can access (OpenID, Accounting)
      const scopes = 'com.intuit.quickbooks.accounting com.intuit.quickbooks.payment openid profile email phone address';
      // State: used to prevent CSRF and maintain state between requests
      // We'll use it to store the userId
      const state = userId;
      // Build authorization URL
      const authUrl = `${getOAuthBaseUrl()}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
      return new Response(JSON.stringify({
        authUrl
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (path === 'token') {
      const { code, redirectUri, userId, realmId } = params;
      if (!code || !redirectUri || !userId || !realmId) {
        throw new Error('Missing required parameters: code, redirectUri, userId, or realmId');
      }
      console.log(`Exchanging code for tokens with realmId ${realmId}`);
      console.log(`Using credentials: CLIENT_ID=${CLIENT_ID.substring(0, 5)}... CLIENT_SECRET=${CLIENT_SECRET.substring(0, 3)}...`);
      console.log(`Exchanging code for tokens with URL: ${TOKEN_URL}`);
      // Exchange authorization code for tokens
      console.log(`Exchanging code for tokens with URL: ${TOKEN_URL}`);
      console.log(`Using redirect URI: ${redirectUri}`);
      
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString();
      
      console.log(`Request params: ${tokenParams}`);
      
      const tokenResponse = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        },
        body: tokenParams
      });
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Token exchange failed:', errorData);
        throw new Error(`Failed to exchange code for tokens: ${JSON.stringify(errorData)}`);
      }
      
      console.log('Token exchange successful');
      const tokenData = await tokenResponse.json();
      // Get company info using the new access token
      const companyName = await getCompanyInfo(tokenData.access_token, realmId);
      // Add company name to token data if available
      if (companyName) {
        tokenData.company_name = companyName;
      }
      // Save the connection to Supabase with the realm ID from the callback
      try {
        console.log('Saving connection to database...');
        await saveConnection(userId, realmId, tokenData);
        console.log('Connection saved successfully');
      } catch (saveError) {
        console.error('Error saving connection:', saveError);
        throw new Error(`Failed to save connection: ${saveError.message}`);
      }
      return new Response(JSON.stringify({
        success: true,
        companyName,
        realmId
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (path === 'refresh') {
      const { refreshToken, userId } = params;
      if (!refreshToken || !userId) {
        throw new Error('Missing required parameters: refreshToken or userId');
      }
      const connection = await getConnection(userId);
      if (!connection) {
        throw new Error('Connection not found');
      }
      // Refresh the token
      const tokenResponse = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString()
      });
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Failed to refresh token: ${JSON.stringify(errorData)}`);
      }
      const tokenData = await tokenResponse.json();
      // Calculate when the token expires
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
      // Update the connection in Supabase
      const { error } = await supabase.from('quickbooks_connections').update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);
      if (error) {
        throw new Error(`Failed to update connection: ${error.message}`);
      }
      return new Response(JSON.stringify({
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: expiresAt.toISOString()
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (path === 'revoke') {
      const { userId } = params;
      if (!userId) {
        throw new Error('Missing required parameter: userId');
      }
      const connection = await getConnection(userId);
      if (!connection) {
        throw new Error('Connection not found');
      }
      // Revoke the token
      const revokeResponse = await fetch(REVOKE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          token: connection.access_token
        }).toString()
      });
      // Delete the connection from Supabase
      const { error } = await supabase.from('quickbooks_connections').delete().eq('user_id', userId);
      if (error) {
        throw new Error(`Failed to delete connection: ${error.message}`);
      }
      return new Response(JSON.stringify({
        success: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Endpoint not found
    throw new Error(`Unknown endpoint: ${path}`);
  } catch (error) {
    console.error('Error in QuickBooks auth function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
