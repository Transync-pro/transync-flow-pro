// supabase/functions/quickbooks-auth/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OAuthClient } from "https://esm.sh/intuit-oauth@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

// Standard OAuth2 endpoints for QuickBooks
const QUICKBOOKS_CLIENT_ID = Deno.env.get("QUICKBOOKS_CLIENT_ID") || "";
const QUICKBOOKS_CLIENT_SECRET = Deno.env.get("QUICKBOOKS_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "https://preview--transync-flow-pro.lovable.app";
const QUICKBOOKS_ENVIRONMENT = Deno.env.get("QUICKBOOKS_ENVIRONMENT") || "sandbox"; // 'sandbox' or 'production'

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Edge function loaded with environment:", {
  CLIENT_ID_EXISTS: !!QUICKBOOKS_CLIENT_ID,
  CLIENT_SECRET_EXISTS: !!QUICKBOOKS_CLIENT_SECRET,
  SUPABASE_URL_EXISTS: !!SUPABASE_URL,
  SERVICE_ROLE_KEY_EXISTS: !!SUPABASE_SERVICE_ROLE_KEY,
  APP_URL,
  QUICKBOOKS_ENVIRONMENT
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`QuickBooks auth function called: ${req.method} ${new URL(req.url).pathname}`);
  
  try {
    // Parse request body
    let body = {};
    if (req.method !== "GET") {
      try {
        body = await req.json();
        console.log("Request body:", JSON.stringify(body));
      } catch (e) {
        console.error("Error parsing request body:", e);
      }
    }
    
    const { action } = body as any;
    
    // === STEP 1: AUTHORIZE - Generate QuickBooks authorization URL ===
    if (action === "authorize") {
      console.log("Processing authorize action");
      
      const redirectUri = (body as any).redirectUri || `${APP_URL}/dashboard/quickbooks-callback`;
      
      // Validate environment
      if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET) {
        console.error("Missing QuickBooks credentials:", {
          clientIdExists: !!QUICKBOOKS_CLIENT_ID,
          clientSecretExists: !!QUICKBOOKS_CLIENT_SECRET
        });
        return new Response(
          JSON.stringify({ 
            error: "Missing QuickBooks API credentials. Check server environment variables." 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Create OAuth client
      const oauthClient = new OAuthClient({
        clientId: QUICKBOOKS_CLIENT_ID,
        clientSecret: QUICKBOOKS_CLIENT_SECRET,
        environment: QUICKBOOKS_ENVIRONMENT,
        redirectUri: redirectUri,
      });
      
      // Generate authorization URL with mandatory scopes
      const state = crypto.randomUUID();
      const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
        state: state
      });
      
      console.log("Generated authorization URL:", authUri);
      
      return new Response(
        JSON.stringify({ authUrl: authUri, state }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // === STEP 2: CALLBACK - Exchange code for tokens ===
    if (action === "callback") {
      console.log("Processing callback action");
      
      const { code, realmId, state: userId, redirectUri } = body as any;
      
      console.log("Callback parameters:", { 
        codeExists: !!code, 
        realmId, 
        userId, 
        redirectUri 
      });
      
      if (!code || !realmId || !userId) {
        console.error("Missing required callback parameters");
        return new Response(
          JSON.stringify({ error: "Missing required parameters (code, realmId, state)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Create OAuth client
      const oauthClient = new OAuthClient({
        clientId: QUICKBOOKS_CLIENT_ID,
        clientSecret: QUICKBOOKS_CLIENT_SECRET,
        environment: QUICKBOOKS_ENVIRONMENT,
        redirectUri: redirectUri || `${APP_URL}/dashboard/quickbooks-callback`,
      });
      
      try {
        // Exchange authorization code for tokens
        console.log("Exchanging code for tokens...");
        const tokenResponse = await oauthClient.createToken(code);
        console.log("Token response received:", !!tokenResponse);
        
        const tokenData = tokenResponse.getJson();
        const token = tokenData.token;
        
        if (!token || !token.access_token) {
          throw new Error("Invalid token response from QuickBooks");
        }
        
        console.log("Token acquired:", {
          accessTokenExists: !!token.access_token,
          refreshTokenExists: !!token.refresh_token,
          expiresIn: token.expires_in
        });
        
        // Calculate expiry date
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + token.expires_in);
        
        // Fetch company info when possible
        let companyName = null;
        try {
          oauthClient.setToken(token);
          const companyInfoResponse = await oauthClient.getCompanyInfo(realmId);
          const companyInfo = companyInfoResponse.getJson();
          companyName = companyInfo.CompanyInfo?.CompanyName || null;
          console.log("Company name retrieved:", companyName);
        } catch (companyError) {
          console.warn("Failed to fetch company info:", companyError);
          // Continue despite this error
        }
        
        // Store connection in database
        const { data, error } = await supabase
          .from("quickbooks_connections")
          .upsert({
            user_id: userId,
            realm_id: realmId,
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            expires_at: expiresAt.toISOString(),
            company_name: companyName,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" })
          .select();
        
        if (error) {
          console.error("Database error storing connection:", error);
          throw new Error(`Failed to store QuickBooks connection: ${error.message}`);
        }
        
        console.log("Connection stored successfully");
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            realmId,
            companyName
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Token exchange error:", error);
        return new Response(
          JSON.stringify({ 
            error: "Failed to exchange authorization code for tokens", 
            details: error.message 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // === STEP 3: REFRESH - Refresh access token ===
    if (action === "refresh") {
      console.log("Processing refresh action");
      
      const { userId } = body as any;
      
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
        console.error("No QuickBooks connection found:", fetchError);
        return new Response(
          JSON.stringify({ error: "No QuickBooks connection found for this user" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        // Create OAuth client for refresh
        const refreshClient = new OAuthClient({
          clientId: QUICKBOOKS_CLIENT_ID,
          clientSecret: QUICKBOOKS_CLIENT_SECRET,
          environment: QUICKBOOKS_ENVIRONMENT,
          redirectUri: `${APP_URL}/dashboard/quickbooks-callback`,
        });
        
        // Set token for refresh
        refreshClient.setToken({
          refresh_token: connection.refresh_token,
          access_token: connection.access_token
        });
        
        // Refresh token
        console.log("Refreshing token...");
        const refreshResponse = await refreshClient.refresh();
        const tokenData = refreshResponse.getJson();
        const token = tokenData.token;
        
        if (!token || !token.access_token) {
          throw new Error("Invalid refresh response from QuickBooks");
        }
        
        console.log("Token refreshed successfully");
        
        // Calculate new expiry
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + token.expires_in);
        
        // Update tokens in database
        const { error: updateError } = await supabase
          .from("quickbooks_connections")
          .update({
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);
        
        if (updateError) {
          console.error("Error updating tokens:", updateError);
          throw new Error(`Failed to update tokens: ${updateError.message}`);
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            access_token: token.access_token,
            expires_at: expiresAt.toISOString()
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error refreshing token:", error);
        return new Response(
          JSON.stringify({ error: "Failed to refresh token", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // === STEP 4: REVOKE - Revoke access ===
    if (action === "revoke") {
      console.log("Processing revoke action");
      
      const { userId } = body as any;
      
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
        console.error("No QuickBooks connection found:", fetchError);
        return new Response(
          JSON.stringify({ error: "No QuickBooks connection found for this user" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        // Create OAuth client for revocation
        const oauthClient = new OAuthClient({
          clientId: QUICKBOOKS_CLIENT_ID,
          clientSecret: QUICKBOOKS_CLIENT_SECRET,
          environment: QUICKBOOKS_ENVIRONMENT,
          redirectUri: `${APP_URL}/dashboard/quickbooks-callback`,
        });
        
        // Revoke tokens
        console.log("Revoking token...");
        await oauthClient.revoke(connection.access_token);
        console.log("Token revoked successfully");
        
        // Delete connection from database
        const { error: deleteError } = await supabase
          .from("quickbooks_connections")
          .delete()
          .eq("user_id", userId);
        
        if (deleteError) {
          console.error("Error deleting connection:", deleteError);
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error revoking token:", error);
        return new Response(
          JSON.stringify({ error: "Failed to revoke token", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Unhandled action
    return new Response(
      JSON.stringify({ error: "Invalid action", validActions: ["authorize", "callback", "refresh", "revoke"] }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message || String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
