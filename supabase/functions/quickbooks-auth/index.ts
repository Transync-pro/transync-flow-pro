
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QUICKBOOKS_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QUICKBOOKS_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QUICKBOOKS_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";
const QUICKBOOKS_CLIENT_ID = Deno.env.get("QUICKBOOKS_CLIENT_ID") || "";
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get("QUICKBOOKS_CLIENT_SECRET") || "";
const SUPABASE_URL = "https://emxstmqwnozhwbpippon.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

// Create a Supabase client with the service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Step 1: Generate authorization URL
    if (path === "authorize") {
      const { searchParams } = await req.json();
      const state = crypto.randomUUID();
      const redirectUri = `${APP_URL}/dashboard/quickbooks-callback`;
      
      const authorizationUrl = new URL(QUICKBOOKS_AUTH_URL);
      authorizationUrl.searchParams.append("client_id", QUICKBOOKS_CLIENT_ID);
      authorizationUrl.searchParams.append("response_type", "code");
      authorizationUrl.searchParams.append("scope", "com.intuit.quickbooks.accounting");
      authorizationUrl.searchParams.append("redirect_uri", redirectUri);
      authorizationUrl.searchParams.append("state", state);
      
      // Add any additional parameters provided by the client
      if (searchParams) {
        for (const [key, value] of Object.entries(searchParams)) {
          if (value) authorizationUrl.searchParams.append(key, value as string);
        }
      }
      
      return new Response(JSON.stringify({ url: authorizationUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Step 2: Handle the token exchange
    if (path === "token") {
      const { code, redirectUri, userId } = await req.json();
      
      if (!code || !userId) {
        return new Response(
          JSON.stringify({ error: "Authorization code and user ID are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Exchange code for tokens
      const tokenResponse = await fetch(QUICKBOOKS_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri || `${APP_URL}/dashboard/quickbooks-callback`,
        }),
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        return new Response(
          JSON.stringify({ error: tokenData.error, description: tokenData.error_description }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Calculate token expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
      
      // Store tokens in the database
      const { data: connectionData, error: connectionError } = await supabase
        .from("quickbooks_connections")
        .upsert({
          user_id: userId,
          realm_id: tokenData.realmId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        .select();
      
      if (connectionError) {
        console.error("Error storing tokens:", connectionError);
        return new Response(
          JSON.stringify({ error: "Failed to store tokens" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          realmId: tokenData.realmId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Step 3: Refresh tokens
    if (path === "refresh") {
      const { userId } = await req.json();
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "User ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Get existing tokens
      const { data: connection, error: fetchError } = await supabase
        .from("quickbooks_connections")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (fetchError || !connection) {
        return new Response(
          JSON.stringify({ error: "No QuickBooks connection found for this user" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Check if token needs refresh
      const now = new Date();
      const expiresAt = new Date(connection.expires_at);
      
      // If token is not expired yet, return the current one
      if (expiresAt > now) {
        return new Response(
          JSON.stringify({
            access_token: connection.access_token,
            token_type: connection.token_type,
            realmId: connection.realm_id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Refresh the token
      const refreshResponse = await fetch(QUICKBOOKS_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: connection.refresh_token,
        }),
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshData.error) {
        console.error("Error refreshing token:", refreshData);
        return new Response(
          JSON.stringify({ error: refreshData.error, description: refreshData.error_description }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Calculate new expiration
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshData.expires_in);
      
      // Update tokens in database
      const { error: updateError } = await supabase
        .from("quickbooks_connections")
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          token_type: refreshData.token_type,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      
      if (updateError) {
        console.error("Error updating tokens:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update tokens" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({
          access_token: refreshData.access_token,
          token_type: refreshData.token_type,
          realmId: connection.realm_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Step 4: Revoke tokens
    if (path === "revoke") {
      const { userId } = await req.json();
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "User ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Get existing connection
      const { data: connection, error: fetchError } = await supabase
        .from("quickbooks_connections")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (fetchError || !connection) {
        return new Response(
          JSON.stringify({ error: "No QuickBooks connection found for this user" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Revoke the refresh token
      const revokeResponse = await fetch(QUICKBOOKS_REVOKE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`)}`,
        },
        body: JSON.stringify({
          token: connection.refresh_token,
        }),
      });
      
      // Check response (note: a 200 response means success even if the body is empty)
      if (!revokeResponse.ok) {
        console.error("Error revoking token:", await revokeResponse.text());
        return new Response(
          JSON.stringify({ error: "Failed to revoke token with QuickBooks" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Return success response
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(JSON.stringify({ error: "Not found" }), { 
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
