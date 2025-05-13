const connectToQuickbooks = async () => {
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in before connecting to QuickBooks.",
      variant: "destructive",
    });
    return;
  }

  setError(null);
  try {
    // Get the current URL for the redirect
    const redirectUrl = `${window.location.origin}/dashboard/quickbooks-callback`;
    console.log("Starting QuickBooks connection with redirect URL:", redirectUrl);
    
    // Important: Send minimal data to reduce JWT size
    const requestBody = { 
      action: 'authorize',
      redirectUri: redirectUrl
      // Don't send userId here - it can be extracted from auth
    };
    
    // Call with explicit auth headers instead of relying on built-in auth
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quickbooks-auth`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    // Handle response
    if (!response.ok) {
      console.error("Error response:", await response.text());
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Response data:", data);
    
    if (data && data.authUrl) {
      console.log("Received authorization URL:", data.authUrl);
      window.location.href = data.authUrl;
    } else {
      throw new Error('Failed to get authorization URL');
    }
  } catch (error) {
    console.error("Error connecting to QuickBooks:", error);
    setError("Failed to initiate QuickBooks connection.");
    toast({
      title: "Connection Failed",
      description: "Failed to initiate QuickBooks connection.",
      variant: "destructive",
    });
  }
};