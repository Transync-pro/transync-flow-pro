
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/environmentClient';
import { ConnectionLoading } from '@/components/ConnectionLoading';

const QuickbooksAuthProxy = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const path = searchParams.get('path');
      const redirectUri = searchParams.get('redirectUri');
      const userId = searchParams.get('userId');

      if (path === 'authorize' && redirectUri && userId) {
        try {
          console.log('QuickbooksAuthProxy: Getting authorization URL');
          
          const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
            body: { 
              path: 'authorize',
              redirectUri,
              userId 
            }
          });

          if (error) {
            console.error('QuickbooksAuthProxy: Error getting auth URL:', error);
            if (window.opener) {
              window.opener.postMessage({
                type: 'QB_AUTH_ERROR',
                error: error.message || 'Failed to get authorization URL'
              }, window.location.origin);
            }
            window.close();
            return;
          }
          
          if (data && data.authUrl) {
            console.log('QuickbooksAuthProxy: Redirecting to QuickBooks auth URL');
            window.location.href = data.authUrl;
          } else {
            throw new Error('Failed to get authorization URL');
          }
        } catch (error: any) {
          console.error('QuickbooksAuthProxy: Error:', error);
          if (window.opener) {
            window.opener.postMessage({
              type: 'QB_AUTH_ERROR',
              error: error.message || 'Failed to start authorization'
            }, window.location.origin);
          }
          window.close();
        }
      }
    };

    handleAuthRedirect();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <ConnectionLoading message="Starting QuickBooks authorization..." />
    </div>
  );
};

export default QuickbooksAuthProxy;
