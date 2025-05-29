
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkQBConnectionExists, clearConnectionCache, forceConnectionState } from '@/services/quickbooksApi/connections';
import { logError } from '@/utils/errorLogger';

export type AuthFlowState = 'idle' | 'connecting' | 'authenticating' | 'connected' | 'disconnected' | 'error';

interface AuthFlowContext {
  connectionStatus: AuthFlowState;
  isCheckingConnection: boolean;
  error: string | null;
  checkConnection: (userId: string) => Promise<void>;
  handleAuthSuccess: (userId: string, companyName?: string) => void;
  handleAuthError: (error: string) => void;
  resetFlow: () => void;
}

let globalAuthFlowState: AuthFlowState = 'idle';
let globalError: string | null = null;
let globalIsChecking = false;
const stateSubscribers = new Set<(state: AuthFlowState, error: string | null, isChecking: boolean) => void>();

// Centralized state management for auth flow
const notifySubscribers = () => {
  stateSubscribers.forEach(callback => {
    callback(globalAuthFlowState, globalError, globalIsChecking);
  });
};

const setGlobalState = (state: AuthFlowState, error: string | null = null, isChecking = false) => {
  globalAuthFlowState = state;
  globalError = error;
  globalIsChecking = isChecking;
  notifySubscribers();
};

// Connection checking with proper debouncing and caching
let connectionCheckPromise: Promise<boolean> | null = null;
let lastCheckTime = 0;
const CHECK_DEBOUNCE_MS = 2000;

const checkConnectionInternal = async (userId: string): Promise<boolean> => {
  const now = Date.now();
  
  // Debounce rapid successive calls
  if (connectionCheckPromise && (now - lastCheckTime) < CHECK_DEBOUNCE_MS) {
    return connectionCheckPromise;
  }
  
  lastCheckTime = now;
  
  connectionCheckPromise = (async () => {
    try {
      console.log('AuthFlowManager: Checking connection for user:', userId);
      setGlobalState(globalAuthFlowState, null, true);
      
      // Check for recent auth success flags first
      const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
      const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
      const isRecentAuth = authTimestamp && (Date.now() - parseInt(authTimestamp, 10) < 30000);
      
      if (authSuccess && isRecentAuth) {
        console.log('AuthFlowManager: Recent auth success detected');
        setGlobalState('connected', null, false);
        return true;
      }
      
      // Check database for connection
      const exists = await checkQBConnectionExists(userId);
      const newState = exists ? 'connected' : 'disconnected';
      
      console.log('AuthFlowManager: Connection check result:', newState);
      setGlobalState(newState, null, false);
      
      return exists;
    } catch (error) {
      console.error('AuthFlowManager: Connection check failed:', error);
      logError('AuthFlow connection check failed', {
        source: 'AuthFlowManager',
        context: { userId, error }
      });
      setGlobalState('error', error instanceof Error ? error.message : 'Connection check failed', false);
      return false;
    }
  })();
  
  return connectionCheckPromise;
};

export const useAuthFlow = (): AuthFlowContext => {
  const [connectionStatus, setConnectionStatus] = useState<AuthFlowState>(globalAuthFlowState);
  const [isCheckingConnection, setIsCheckingConnection] = useState(globalIsChecking);
  const [error, setError] = useState<string | null>(globalError);
  const navigate = useNavigate();
  
  // Subscribe to global state changes
  useEffect(() => {
    const handleStateChange = (state: AuthFlowState, error: string | null, isChecking: boolean) => {
      setConnectionStatus(state);
      setError(error);
      setIsCheckingConnection(isChecking);
    };
    
    stateSubscribers.add(handleStateChange);
    
    return () => {
      stateSubscribers.delete(handleStateChange);
    };
  }, []);
  
  const checkConnection = useCallback(async (userId: string) => {
    await checkConnectionInternal(userId);
  }, []);
  
  const handleAuthSuccess = useCallback((userId: string, companyName?: string) => {
    console.log('AuthFlowManager: Handling auth success for user:', userId);
    
    // Set session storage flags for other components
    sessionStorage.setItem('qb_auth_success', 'true');
    sessionStorage.setItem('qb_connection_timestamp', Date.now().toString());
    if (companyName) {
      sessionStorage.setItem('qb_connection_company', companyName);
    }
    
    // Force connection state for smooth transition
    forceConnectionState(userId, true, 10000);
    
    // Update global state
    setGlobalState('connected', null, false);
    
    // Clear connection cache to ensure fresh data
    clearConnectionCache(userId);
    
    // Navigate to dashboard
    console.log('AuthFlowManager: Navigating to dashboard after successful auth');
    navigate('/dashboard', { replace: true });
  }, [navigate]);
  
  const handleAuthError = useCallback((error: string) => {
    console.error('AuthFlowManager: Auth error:', error);
    setGlobalState('error', error, false);
  }, []);
  
  const resetFlow = useCallback(() => {
    console.log('AuthFlowManager: Resetting auth flow');
    setGlobalState('idle', null, false);
    connectionCheckPromise = null;
    lastCheckTime = 0;
  }, []);
  
  return {
    connectionStatus,
    isCheckingConnection,
    error,
    checkConnection,
    handleAuthSuccess,
    handleAuthError,
    resetFlow
  };
};

// Export singleton functions for use in non-React contexts
export const authFlowManager = {
  getState: () => ({ state: globalAuthFlowState, error: globalError, isChecking: globalIsChecking }),
  setState: setGlobalState,
  checkConnection: checkConnectionInternal
};
