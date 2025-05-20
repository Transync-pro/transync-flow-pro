import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, QUICKBOOKS_ENVIRONMENT, API_BASE_URL } from './config.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing from environment');
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

/**
 * Handle token exchange and user identity saving
 * FIX: Completely rewritten to avoid request body consumption issues
 */
const handleTokenExchange = async (params) => {
  try {
    const { code, redirectUri, userId, realmId } = params;
    
    console.log('Token request with params:', {
      code: !!code,
      redirectUri,
      userId,
      realmId
    });
    
    console.log(`Exchanging code for tokens with realmId ${realmId}`);
    
    if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET) {
      throw new Error('Missing QuickBooks client credentials');
    }
    
    if (!code || !redirectUri || !userId || !realmId) {
      throw new Error('Missing required parameters for token exchange');
    }
    
    // Request access token and refresh token
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append('redirect_uri', redirectUri);
    
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }
    
    const tokenData = await response.json();
    console.log('Token exchange successful, received access token and refresh token');
    
    // Calculate token expiration and format dates as ISO strings
    const now = new Date();
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(now.getTime() + expiresIn * 1000);
    const expiresAtISO = expiresAt.toISOString();
    console.log(`Token will expire at ${expiresAtISO}`);
    
    // Fetch company information
    let companyName = "Unknown Company";
    console.log(`Fetching company info for realm ${realmId}`);
    
    try {
      const companyResponse = await fetch(`${API_BASE_URL}/v3/company/${realmId}/companyinfo/${realmId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        companyName = companyData.CompanyInfo?.CompanyName || "Unknown Company";
        console.log(`Retrieved company name: ${companyName}`);
      }
    } catch (companyError) {
      console.warn('Error fetching company information:', companyError);
      // Continue execution, as this is not critical
    }
    
    // Fetch user identity information
    let userIdentity = null;
    
    console.log('Fetching user identity information from QuickBooks Account API');
    try {
      const userResponse = await fetch('https://accounts.platform.intuit.com/v1/openid_connect/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      if (userResponse.ok) {
        userIdentity = await userResponse.json();
        console.log('Successfully retrieved company info for user identity');
      } else {
        console.warn('Failed to retrieve user identity information, status:', userResponse.status);
      }
    } catch (userError) {
      console.warn('Error fetching user identity:', userError);
      // Continue execution, as this is not critical
    }
    
    console.log('User identity fetched:', userIdentity ? 'success' : 'failed');
    
    // Save connection to database
    console.log(`Saving connection for user ${userId} and realmId ${realmId}`);
    
    try {
      const { error: deleteError } = await supabase
        .from('quickbooks_connections')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.warn('Error removing existing connection:', deleteError);
      }
      
      const { error } = await supabase
        .from('quickbooks_connections')
        .insert({
          user_id: userId,
          realm_id: realmId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_at: expiresAtISO,
          x_refresh_token_expires_in: tokenData.x_refresh_token_expires_in,
          id_token: tokenData.id_token,
          company_name: companyName,
          environment: QUICKBOOKS_ENVIRONMENT
        });
      
      if (error) {
        throw new Error(`Error saving connection: ${error.message}`);
      }
      
      console.log('Connection created successfully');
      console.log('Connection saved to database:', !error);
    } catch (dbError) {
      console.error('Database error saving connection:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Save user identity if available
    if (userIdentity && userId) {
      try {
        const { error: identityError } = await supabase
          .from('quickbooks_user_identities')
          .upsert({
            user_id: userId,
            realm_id: realmId,
            qb_user_id: userIdentity.sub,
            email: userIdentity.email,
            email_verified: userIdentity.email_verified,
            given_name: userIdentity.given_name,
            family_name: userIdentity.family_name,
            phone_number: userIdentity.phone_number,
            phone_number_verified: userIdentity.phone_number_verified,
            address: userIdentity.address,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id, realm_id'
          });
        
        if (identityError) {
          console.warn('Error saving user identity:', identityError);
        } else {
          console.log('User identity saved to database');
        }
      } catch (identityDbError) {
        console.warn('Database error saving user identity:', identityDbError);
      }
    } else {
      console.log('No user identity information available to save');
    }
    
    return {
      success: true,
      companyName,
      realmId,
      userIdentity // Include the user identity in the response
    };
  } catch (error) {
    console.error('Error in QuickBooks auth function:', error);
    throw new Error(error.message || 'Internal server error');
  }
};

const fetchUserIdentity = async (accessToken: string) => {
  try {
    const response = await fetch('https://accounts.platform.intuit.com/v1/openid_connect/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch user identity information, status:', response.status);
      return null;
    }

    const userIdentity = await response.json();
    console.log('Successfully retrieved user identity information');
    return userIdentity;
  } catch (error) {
    console.error('Error fetching user identity:', error);
    return null;
  }
};

const refreshToken = async (refreshTokenValue: string, userId: string) => {
  try {
    console.log(`Refreshing token for user ${userId}`);

    if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET) {
      throw new Error('Missing QuickBooks client credentials');
    }

    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', refreshTokenValue);

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();
    console.log('Token refresh successful, received new access token and refresh token');

    // Calculate token expiration and format dates as ISO strings
    const now = new Date();
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(now.getTime() + expiresIn * 1000);
    const expiresAtISO = expiresAt.toISOString();
    console.log(`New token will expire at ${expiresAtISO}`);

    // Update connection in database
    try {
      const { error } = await supabase
        .from('quickbooks_connections')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_at: expiresAtISO,
          x_refresh_token_expires_in: tokenData.x_refresh_token_expires_in
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Error updating connection: ${error.message}`);
      }

      console.log('Connection updated successfully');
    } catch (dbError) {
      console.error('Database error updating connection:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAtISO
    };
  } catch (error) {
    console.error('Error in refreshToken function:', error);
    throw new Error(error.message || 'Internal server error');
  }
};

const revokeTokens = async (accessToken: string, refreshTokenValue: string, userId: string) => {
  try {
    console.log(`Revoking tokens for user ${userId}`);

    if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET) {
      throw new Error('Missing QuickBooks client credentials');
    }

    const revokeAccessTokenFormData = new URLSearchParams();
    revokeAccessTokenFormData.append('token', accessToken);

    const revokeRefreshTokenFormData = new URLSearchParams();
    revokeRefreshTokenFormData.append('token', refreshTokenValue);

    const accessTokenResponse = await fetch('https://developer.intuit.com/app/developer/qbo/oauth2/v1/tokens/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`
      },
      body: revokeAccessTokenFormData
    });

    const refreshTokenResponse = await fetch('https://developer.intuit.com/app/developer/qbo/oauth2/v1/tokens/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`
      },
      body: revokeRefreshTokenFormData
    });

    if (!accessTokenResponse.ok) {
      console.warn(`Access token revocation failed: ${accessTokenResponse.status}`);
    }

    if (!refreshTokenResponse.ok) {
      console.warn(`Refresh token revocation failed: ${refreshTokenResponse.status}`);
    }

    // Delete connection from database
    try {
      const { error } = await supabase
        .from('quickbooks_connections')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Error deleting connection: ${error.message}`);
      }

      console.log('Connection deleted successfully');
    } catch (dbError) {
      console.error('Database error deleting connection:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error in revokeTokens function:', error);
    throw new Error(error.message || 'Internal server error');
  }
};

const requestUserConsent = (redirectUri: string, userId: string): string => {
  if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_ENVIRONMENT) {
    throw new Error('Missing QuickBooks client credentials or environment');
  }

  const scopes = [
    'com.intuit.quickbooks.accounting',
    'openid',
    'profile',
    'email',
    'phone',
    'address'
  ];

  const authorizationUrl = `https://appcenter.intuit.com/app/oauth2/connect/scopes?client_id=${QUICKBOOKS_CLIENT_ID}&scope=${scopes.join(' ')}&redirect_uri=${redirectUri}&response_type=code&state=${userId}`;
  return authorizationUrl;
};

// Main server handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    console.log('Edge function received request. Environment:', QUICKBOOKS_ENVIRONMENT);
    console.log('Client ID configured:', QUICKBOOKS_CLIENT_ID ? 'Yes' : 'No');
    
    // Parse the request body
    let reqBody;
    try {
      reqBody = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    
    const { path, ...params } = reqBody;
    
    console.log(`Request path: ${path}, params:`, params);
    
    if (path === 'authorize') {
      const { redirectUri, userId } = params;
      if (!redirectUri || !userId) {
        return new Response(JSON.stringify({
          error: 'Missing required parameters: redirectUri, userId',
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        });
      }
      
      const authUrl = requestUserConsent(redirectUri, userId);
      console.log(`Generated auth URL: ${authUrl}`);
      
      return new Response(JSON.stringify({
        authUrl
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (path === 'token') {
      // FIX: Get parameters from the already parsed request body
      try {
        const result = await handleTokenExchange(params);
        return new Response(JSON.stringify(result), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
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
    } else if (path === 'refresh') {
      const { refreshToken: refreshTokenValue, userId } = params;
      if (!refreshTokenValue || !userId) {
        return new Response(JSON.stringify({
          error: 'Missing required parameters: refreshToken, userId',
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        });
      }
      
      try {
        const result = await refreshToken(refreshTokenValue, userId);
        return new Response(JSON.stringify(result), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
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
    } else if (path === 'revoke') {
      const { accessToken, refreshToken: refreshTokenValue, userId } = params;
      if (!accessToken || !refreshTokenValue || !userId) {
        return new Response(JSON.stringify({
          error: 'Missing required parameters: accessToken, refreshToken, userId',
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        });
      }
      
      try {
        const result = await revokeTokens(accessToken, refreshTokenValue, userId);
        return new Response(JSON.stringify(result), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
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
    } else {
      return new Response(JSON.stringify({
        error: `Unknown path: ${path}`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
  } catch (error) {
    console.error('Error in QuickBooks auth function:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
