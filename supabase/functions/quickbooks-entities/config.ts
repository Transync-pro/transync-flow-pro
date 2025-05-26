
// Configuration and environment variables
export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
export const QUICKBOOKS_ENVIRONMENT = Deno.env.get('QUICKBOOKS_ENVIRONMENT') || 'sandbox';

// CORS headers for browser requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get the appropriate QuickBooks API base URL based on environment
export const getQBApiBaseUrl = () => {
  return QUICKBOOKS_ENVIRONMENT === 'production' 
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';
};

// Helper to determine environment from request headers or URL
export const getEnvironmentFromRequest = (request: Request) => {
  const url = new URL(request.url);
  const origin = request.headers.get('origin') || '';
  
  // Check if request comes from staging path
  if (origin.includes('/staging') || url.pathname.includes('staging')) {
    return 'staging';
  }
  
  return 'production';
};
