
import { checkQBConnectionExists, clearConnectionCache } from '@/services/quickbooksApi/connections';
import { logError } from '@/utils/errorLogger';

export type ConnectionStatus = 'unknown' | 'connected' | 'disconnected' | 'checking' | 'error';

interface ConnectionInfo {
  status: ConnectionStatus;
  lastChecked: number;
  error?: string;
  companyName?: string;
}

class ConnectionStatusService {
  private statusCache = new Map<string, ConnectionInfo>();
  private checkingPromises = new Map<string, Promise<boolean>>();
  private subscribers = new Set<(userId: string, info: ConnectionInfo) => void>();

  subscribe(callback: (userId: string, info: ConnectionInfo) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(userId: string, info: ConnectionInfo) {
    this.subscribers.forEach(callback => callback(userId, info));
  }

  private updateStatus(userId: string, status: ConnectionStatus, error?: string, companyName?: string) {
    const info: ConnectionInfo = {
      status,
      lastChecked: Date.now(),
      error,
      companyName
    };
    
    this.statusCache.set(userId, info);
    this.notifySubscribers(userId, info);
  }

  async checkConnectionStatus(userId: string, force = false): Promise<boolean> {
    if (!userId) {
      console.warn('ConnectionStatusService: No userId provided');
      return false;
    }

    // Check if we're already checking this user's connection
    if (this.checkingPromises.has(userId)) {
      return this.checkingPromises.get(userId)!;
    }

    // Check cache first (unless forced)
    const cached = this.statusCache.get(userId);
    if (!force && cached && (Date.now() - cached.lastChecked) < 30000) { // 30 second cache
      console.log('ConnectionStatusService: Using cached status for user:', userId, cached.status);
      return cached.status === 'connected';
    }

    // Start checking
    this.updateStatus(userId, 'checking');

    const checkPromise = this.performConnectionCheck(userId);
    this.checkingPromises.set(userId, checkPromise);

    try {
      const isConnected = await checkPromise;
      this.updateStatus(userId, isConnected ? 'connected' : 'disconnected');
      return isConnected;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateStatus(userId, 'error', errorMessage);
      return false;
    } finally {
      this.checkingPromises.delete(userId);
    }
  }

  private async performConnectionCheck(userId: string): Promise<boolean> {
    try {
      console.log('ConnectionStatusService: Checking connection for user:', userId);
      
      // Check for recent auth success flags first
      const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
      const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
      const isRecentAuth = authTimestamp && (Date.now() - parseInt(authTimestamp, 10) < 30000);
      
      if (authSuccess && isRecentAuth) {
        console.log('ConnectionStatusService: Recent auth success detected');
        return true;
      }
      
      // Check database
      const exists = await checkQBConnectionExists(userId);
      console.log('ConnectionStatusService: Database check result:', exists);
      
      return exists;
    } catch (error) {
      console.error('ConnectionStatusService: Check failed:', error);
      logError('Connection status check failed', {
        source: 'ConnectionStatusService',
        context: { userId, error }
      });
      throw error;
    }
  }

  getStatus(userId: string): ConnectionInfo | undefined {
    return this.statusCache.get(userId);
  }

  clearCache(userId?: string) {
    if (userId) {
      this.statusCache.delete(userId);
      this.checkingPromises.delete(userId);
      clearConnectionCache(userId);
    } else {
      this.statusCache.clear();
      this.checkingPromises.clear();
    }
  }

  markAsConnected(userId: string, companyName?: string) {
    this.updateStatus(userId, 'connected', undefined, companyName);
  }

  markAsDisconnected(userId: string) {
    this.updateStatus(userId, 'disconnected');
    clearConnectionCache(userId);
  }
}

// Export singleton instance
export const connectionStatusService = new ConnectionStatusService();
