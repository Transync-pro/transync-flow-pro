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
const getQBApiBaseUrl = () => {
  return QUICKBOOKS_ENVIRONMENT === 'production' ? 'https://quickbooks.api.intuit.com' : 'https://sandbox-quickbooks.api.intuit.com';
};

// Get the appropriate Intuit OAuth base URL
const getOAuthBaseUrl = () => {
  return 'https://appcenter.intuit.com/connect/oauth2';
};

// Save the connection to Supabase
const saveConnection = async (userId, realmId, tokenResponse) => {
  console.log(`[STAGING] Saving connection for user ${userId} and realmId ${realmId}`);
  try {
    // Calculate when the token expires
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
    console.log(`[STAGING] Token will expire at ${expiresAt.toISOString()}`);

    // Check if a connection already exists for this user
    const { data: existingConnection, error: queryError } = await supabase
      .from('quickbooks_connections')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('[STAGING] Error checking for existing connection:', queryError);
      throw queryError;
    }

    if (existingConnection) {
      // Update existing connection
      console.log(`[STAGING] Updating existing connection for user ${userId}`);
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .update({
          realm_id: realmId,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          token_type: tokenResponse.token_type,
          expires_at: expiresAt.toISOString(),
          company_name: tokenResponse.company_name,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('[STAGING] Error updating connection:', error);
        throw error;
      }
      console.log('[STAGING] Connection updated successfully');
      return { success: true, data };
    } else {
      // Create new connection
      console.log(`[STAGING] Creating new connection for user ${userId}`);
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .insert({
          user_id: userId,
          realm_id: realmId,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          token_type: tokenResponse.token_type,
          expires_at: expiresAt.toISOString(),
          company_name: tokenResponse.company_name
        })
        .select();

      if (error) {
        console.error('[STAGING] Error creating connection:', error);
        throw error;
      }
      console.log('[STAGING] Connection created successfully');
      return { success: true, data };
    }
  } catch (error) {
    console.error('[STAGING] Error saving connection:', error);
    throw error;
  }
};

// Get the connection for a user
const getConnection = async (userId) => {
  console.log(`[STAGING] Getting connection for user ${userId}`);
  const { data, error } = await supabase
    .from('quickbooks_connections')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('[STAGING] Error getting connection:', error);
    return null;
  }
  return data;
};

// Get company info from QuickBooks
const getCompanyInfo = async (accessToken, realmId) => {
  try {
    console.log(`[STAGING] Fetching company info for realm ${realmId}`);
    const response = await fetch(`${getQBApiBaseUrl()}/v3/company/${realmId}/companyinfo/${realmId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[STAGING] Failed to get company info: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to get company info: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const companyName = data.CompanyInfo?.CompanyName || null;
    console.log(`[STAGING] Retrieved company name: ${companyName || 'Unknown'}`);
    return companyName;
  } catch (error) {
    console.error('[STAGING] Error fetching company info:', error);
    return null;
  }
};

// Fetch user identity information
const fetchUserIdentity = async (accessToken, realmId) => {
  try {
    console.log('[STAGING] Fetching user identity information from QuickBooks Account API');
    
    const response = await fetch(`${getQBApiBaseUrl()}/v3/company/${realmId}/companyinfo/${realmId}?minorversion=65`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[STAGING] Failed to get company info for user identity: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[STAGING] Successfully retrieved company info for user identity');
    
    if (data.CompanyInfo) {
      const info = data.CompanyInfo;
      const email = info.Email?.Address || null;
      let firstName = null;
      let lastName = null;
      let phone = null;
      
      if (info.CompanyName) {
        const nameParts = info.CompanyName.split(' ');
        if (nameParts.length > 1) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        } else {
          firstName = info.CompanyName;
        }
      }
      
      if (info.PrimaryPhone) {
        phone = info.PrimaryPhone.FreeFormNumber;
      }
      
      return {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone
      };
    }
    
    return null;
  } catch (error) {
    console.error('[STAGING] Error fetching user identity from Account API:', error);
    return null;
  }
};

// Handle token exchange and user identity saving
const handleTokenExchange = async (params) => {
  try {
    const { code, redirectUri, userId, realmId } = params;
    
    console.log('[STAGING] Token request with params:', {
      code: !!code,
      redirectUri,
      userId,
      realmId
    });
    
    if (!code || !redirectUri || !userId || !realmId) {
      console.error('[STAGING] Missing required parameters:', {
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
    
    console.log(`[STAGING] Exchanging code for tokens with realmId ${realmId}`);
    
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
      console.error('[STAGING] Token exchange failed:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(`Failed to exchange code for tokens: ${JSON.stringify(errorData)}`);
      } catch (e) {
        throw new Error(`Failed to exchange code for tokens: ${errorText}`);
      }
    }
    
    const tokenData = await tokenResponse.json();
    console.log('[STAGING] Token exchange successful, received access token and refresh token');
    
    // Get company info using the new access token
    const companyName = await getCompanyInfo(tokenData.access_token, realmId);
    if (companyName) {
      tokenData.company_name = companyName;
      console.log(`[STAGING] Retrieved company name: ${companyName}`);
    }
    
    // Fetch user identity information
    const userIdentity = await fetchUserIdentity(tokenData.access_token, realmId);
    console.log('[STAGING] User identity fetched:', userIdentity ? 'success' : 'failed');
    
    // Save the connection to Supabase
    const saveResult = await saveConnection(userId, realmId, tokenData);
    console.log('[STAGING] Connection saved to database:', saveResult.success);
    
    // Save user identity information to Supabase if we got any
    if (userIdentity) {
      try {
        const { data: existingIdentity } = await supabase
          .from('quickbooks_user_info')
          .select('*')
          .eq('user_id', userId)
          .eq('realm_id', realmId)
          .single();
        
        const identityInfo = {
          user_id: userId,
          realm_id: realmId,
          first_name: userIdentity.first_name || null,
          last_name: userIdentity.last_name || null,
          email: userIdentity.email || null,
          phone: userIdentity.phone || null,
          updated_at: new Date().toISOString()
        };
        
        if (existingIdentity) {
          await supabase
            .from('quickbooks_user_info')
            .update(identityInfo)
            .eq('id', existingIdentity.id);
        } else {
          await supabase
            .from('quickbooks_user_info')
            .insert(identityInfo);
        }
      } catch (error) {
        console.error("[STAGING] Error saving user identity:", error);
      }
      
      console.log('[STAGING] User identity saved to database');
    } else {
      console.log('[STAGING] No user identity information available to save');
    }
    
    return {
      success: true,
      companyName,
      realmId,
      userIdentity
    };
  } catch (error) {
    console.error('[STAGING] Error in QuickBooks auth function:', error);
    throw new Error(error.message || 'Internal server error');
  }
};

// Handle the request
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log('[STAGING] Edge function received request. Environment:', QUICKBOOKS_ENVIRONMENT);
    console.log('[STAGING] Client ID configured:', QUICKBOOKS_CLIENT_ID ? 'Yes' : 'No');
    
    // Parse the request body
    let reqBody;
    try {
      reqBody = await req.json();
    } catch (error) {
      console.error('[STAGING] Error parsing request body:', error);
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    const { path, ...params } = reqBody;
    console.log(`[STAGING] Request path: ${path}, params:`, params);
    
    if (path === 'authorize') {
      const { redirectUri, userId } = params;
      if (!redirectUri || !userId) {
        throw new Error('Missing required parameters: redirectUri or userId');
      }
      if (!QUICKBOOKS_CLIENT_ID) {
        throw new Error('Missing QuickBooks client ID. Check environment configuration.');
      }

      const scopes = 'com.intuit.quickbooks.accounting openid profile email phone address';
      const state = userId;
      const authUrl = `${getOAuthBaseUrl()}?client_id=${QUICKBOOKS_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
      
      console.log('[STAGING] Generated auth URL:', authUrl);
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } 
    else if (path === 'token') {
      try {
        const result = await handleTokenExchange(params);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
    }
    else if (path === 'refresh') {
      const { refreshToken, userId } = params;
      if (!refreshToken || !userId) {
        throw new Error('Missing required parameters: refreshToken or userId');
      }

      const connection = await getConnection(userId);
      if (!connection) {
        throw new Error('Connection not found');
      }

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
        console.error('[STAGING] Token refresh failed:', responseText);
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(`Failed to refresh token: ${JSON.stringify(errorData)}`);
        } catch (e) {
          throw new Error(`Failed to refresh token: ${responseText}`);
        }
      }

      const tokenData = await tokenResponse.json();
      console.log('[STAGING] Token refresh successful, received new tokens');

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

      const { error } = await supabase
        .from('quickbooks_connections')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[STAGING] Failed to update connection:', error);
        throw new Error(`Failed to update connection: ${error.message}`);
      }

      console.log('[STAGING] Connection updated with refreshed tokens');
      return new Response(JSON.stringify({
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: expiresAt.toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    else if (path === 'revoke') {
      const { userId } = params;
      if (!userId) {
        throw new Error('Missing required parameter: userId');
      }

      const connection = await getConnection(userId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      console.log(`[STAGING] Revoking token for user ${userId}`);

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
        console.warn('[STAGING] Token revocation returned non-OK response:', revokeResponse.status, revokeResponse.statusText);
      } else {
        console.log('[STAGING] Token revoked successfully');
      }

      const { error } = await supabase
        .from('quickbooks_connections')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('[STAGING] Failed to delete connection:', error);
        throw new Error(`Failed to delete connection: ${error.message}`);
      }

      console.log('[STAGING] Connection deleted from database');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    else if (path === 'get-user-identity') {
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
        console.error('[STAGING] Error fetching user identity:', error);
        throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        userIdentity: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Unknown endpoint: ${path}`);
  } catch (error) {
    console.error('[STAGING] Error in QuickBooks auth function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
