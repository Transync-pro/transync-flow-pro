
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
const QUICKBOOKS_CLIENT_ID = Deno.env.get('SANDBOX_ID') || '';
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get('SANDBOX_SECRET') || '';
const QUICKBOOKS_ENVIRONMENT = Deno.env.get('QUICKBOOKS_ENVIRONMENT') || 'sandbox';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// Use the admin client to bypass RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Get the appropriate QuickBooks API base URL
const getQBApiBaseUrl = ()=>{
  return QUICKBOOKS_ENVIRONMENT === 'production' ? 'https://quickbooks.api.intuit.com' : 'https://sandbox-quickbooks.api.intuit.com';
};
// Get the appropriate Intuit OAuth base URL
const getOAuthBaseUrl = ()=>{
  return 'https://appcenter.intuit.com/connect/oauth2';
};
// Save the connection to Supabase
const saveConnection = async (userId, realmId, tokenResponse)=>{
  console.log(`Saving connection for user ${userId} and realmId ${realmId}`);
  try {
    // Calculate when the token expires
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
    console.log(`Token will expire at ${expiresAt.toISOString()}`);
    // Check if a connection already exists for this user
    const { data: existingConnection, error: queryError } = await supabase.from('quickbooks_connections').select('id').eq('user_id', userId).single();
    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Error checking for existing connection:', queryError);
      throw queryError;
    }
    if (existingConnection) {
      // Update existing connection
      console.log(`Updating existing connection for user ${userId}`);
      const { data, error } = await supabase.from('quickbooks_connections').update({
        realm_id: realmId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_at: expiresAt.toISOString(),
        company_name: tokenResponse.company_name,
        updated_at: new Date().toISOString()
      }).eq('user_id', userId).select();
      if (error) {
        console.error('Error updating connection:', error);
        throw error;
      }
      console.log('Connection updated successfully');
      return {
        success: true,
        data
      };
    } else {
      // Create new connection
      console.log(`Creating new connection for user ${userId}`);
      const { data, error } = await supabase.from('quickbooks_connections').insert({
        user_id: userId,
        realm_id: realmId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_at: expiresAt.toISOString(),
        company_name: tokenResponse.company_name // May be undefined
      }).select();
      if (error) {
        console.error('Error creating connection:', error);
        throw error;
      }
      console.log('Connection created successfully');
      return {
        success: true,
        data
      };
    }
  } catch (error) {
    console.error('Error saving connection:', error);
    throw error;
  }
};

// Get the connection for a user
const getConnection = async (userId)=>{
  console.log(`Getting connection for user ${userId}`);
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
    console.log(`Fetching company info for realm ${realmId}`);
    const response = await fetch(`${getQBApiBaseUrl()}/v3/company/${realmId}/companyinfo/${realmId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get company info: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to get company info: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const companyName = data.CompanyInfo?.CompanyName || null;
    console.log(`Retrieved company name: ${companyName || 'Unknown'}`);
    return companyName;
  } catch (error) {
    console.error('Error fetching company info:', error);
    return null;
  }
};

// NEW FUNCTION: Fetch user identity information from QuickBooks OpenID Connect endpoint
const fetchUserIdentity = async (accessToken) => {
  try {
    console.log('Fetching user identity information from QuickBooks');
    const response = await fetch('https://oauth.platform.intuit.com/v1/openid_connect/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get user info: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const userData = await response.json();
    console.log('Successfully retrieved user identity information');
    return {
      first_name: userData.givenName,
      last_name: userData.familyName,
      email: userData.email,
      phone: userData.phoneNumber
    };
  } catch (error) {
    console.error('Error fetching user identity:', error);
    return null;
  }
};

// NEW FUNCTION: Save user identity to Supabase
const saveUserIdentity = async (userId, realmId, userInfo) => {
  if (!userInfo) {
    console.log('No user identity information to save');
    return;
  }

  try {
    console.log(`Saving user identity for user ${userId} and realm ${realmId}`);
    
    const { data, error } = await supabase
      .from('quickbooks_user_info')
      .upsert({
        user_id: userId,
        realm_id: realmId,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        email: userInfo.email,
        phone: userInfo.phone,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving user identity:', error);
      throw error;
    }

    console.log('User identity saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in saveUserIdentity:', error);
    return { success: false, error };
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
    console.log('Edge function received request. Environment:', QUICKBOOKS_ENVIRONMENT);
    console.log('Client ID configured:', QUICKBOOKS_CLIENT_ID ? 'Yes' : 'No');
    const { path, ...params } = await req.json();
    console.log(`Request path: ${path}, params:`, params);
    if (path === 'authorize') {
      const { redirectUri, userId } = params;
      if (!redirectUri || !userId) {
        throw new Error('Missing required parameters: redirectUri or userId');
      }
      if (!QUICKBOOKS_CLIENT_ID) {
        throw new Error('Missing QuickBooks client ID. Check environment configuration.');
      }
      // Scope: define what your app can access (OpenID, Accounting)
      const scopes = 'com.intuit.quickbooks.accounting openid profile email phone address';
      // State: used to prevent CSRF and maintain state between requests
      // We'll use it to store the userId
      const state = userId;
      // Build authorization URL
      const authUrl = `${getOAuthBaseUrl()}?client_id=${QUICKBOOKS_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
      console.log('Generated auth URL:', authUrl);
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
      console.log('Token request with params:', {
        code: !!code,
        redirectUri,
        userId,
        realmId
      });
      if (!code || !redirectUri || !userId || !realmId) {
        console.error('Missing required parameters:', {
          code: !!code,
          redirectUri: !!redirectUri,
          userId: !!userId,
          realmId: !!realmId
        });
        throw new Error('Missing required parameters: code, redirectUri, userId, or realmId');
      }
      if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET) {
        throw new Error('Missing QuickBooks credentials. Check environment configuration.');
      }
      console.log(`Exchanging code for tokens with realmId ${realmId}`);
      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        }).toString()
      });
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(`Failed to exchange code for tokens: ${JSON.stringify(errorData)}`);
        } catch (e) {
          throw new Error(`Failed to exchange code for tokens: ${errorText}`);
        }
      }
      const tokenData = await tokenResponse.json();
      console.log('Token exchange successful, received access token and refresh token');
      
      // Get company info using the new access token
      const companyName = await getCompanyInfo(tokenData.access_token, realmId);
      // Add company name to token data if available
      if (companyName) {
        tokenData.company_name = companyName;
        console.log(`Retrieved company name: ${companyName}`);
      }
      
      // NEW: Fetch user identity information from QuickBooks
      const userIdentity = await fetchUserIdentity(tokenData.access_token);
      
      // Save the connection to Supabase with the realm ID from the callback
      const saveResult = await saveConnection(userId, realmId, tokenData);
      console.log('Connection saved to database:', saveResult.success);
      
      // NEW: Save user identity information to Supabase
      if (userIdentity) {
        await saveUserIdentity(userId, realmId, userIdentity);
        console.log('User identity saved to database');
      }
      
      return new Response(JSON.stringify({
        success: true,
        companyName,
        realmId,
        userIdentity // Include the user identity in the response
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
      const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString()
      });
      if (!tokenResponse.ok) {
        const responseText = await tokenResponse.text();
        console.error('Token refresh failed:', responseText);
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(`Failed to refresh token: ${JSON.stringify(errorData)}`);
        } catch (e) {
          throw new Error(`Failed to refresh token: ${responseText}`);
        }
      }
      const tokenData = await tokenResponse.json();
      console.log('Token refresh successful, received new tokens');
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
        console.error('Failed to update connection:', error);
        throw new Error(`Failed to update connection: ${error.message}`);
      }
      console.log('Connection updated with refreshed tokens');
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
      console.log(`Revoking token for user ${userId}`);
      // Revoke the token
      const revokeResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          token: connection.access_token
        }).toString()
      });
      if (!revokeResponse.ok) {
        console.warn('Token revocation returned non-OK response:', revokeResponse.status, revokeResponse.statusText);
      // Continue anyway to delete the connection
      } else {
        console.log('Token revoked successfully');
      }
      // Delete the connection from Supabase
      const { error } = await supabase.from('quickbooks_connections').delete().eq('user_id', userId);
      if (error) {
        console.error('Failed to delete connection:', error);
        throw new Error(`Failed to delete connection: ${error.message}`);
      }
      console.log('Connection deleted from database');
      return new Response(JSON.stringify({
        success: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (path === 'get-user-identity') { // NEW ENDPOINT to get user identity
      const { userId, realmId } = params;
      if (!userId) {
        throw new Error('Missing required parameter: userId');
      }

      const { data, error } = await supabase
        .from('quickbooks_user_info')
        .select('*')
        .eq('user_id', userId)
        .eq(realmId ? 'realm_id' : 'id', realmId || userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user identity:', error);
        throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        userIdentity: data
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
