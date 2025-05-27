
// NavigationController.ts - Singleton to manage critical navigation transitions

import { navigateWithEnvironment } from "@/config/environment";

class NavigationController {
  private static instance: NavigationController;
  private isNavigating: boolean = false;
  private transitionTimeoutId: NodeJS.Timeout | null = null;
  
  // Private constructor for singleton
  private constructor() {}
  
  // Get the instance
  public static getInstance(): NavigationController {
    if (!NavigationController.instance) {
      NavigationController.instance = new NavigationController();
    }
    return NavigationController.instance;
  }
  
  // Method to handle QuickBooks auth success
  public handleAuthSuccess(userId: string, navigate: Function): void {
    console.log('NavigationController: Handling successful QuickBooks authentication');
    
    // Prevent any other navigation during this transition
    this.isNavigating = true;
    
    // Clear any existing transition timeout
    if (this.transitionTimeoutId) {
      clearTimeout(this.transitionTimeoutId);
    }
    
    // Set session flags for all components to respect
    sessionStorage.setItem('qb_navigation_in_progress', 'true');
    sessionStorage.setItem('qb_auth_success', 'true');
    sessionStorage.setItem('qb_connection_timestamp', Date.now().toString());
    sessionStorage.setItem('qb_skip_auth_redirect', 'true');
    
    // Navigate directly to dashboard using environment-aware navigation
    const dashboardPath = navigateWithEnvironment('/dashboard');
    console.log('NavigationController: Navigating to dashboard with path:', dashboardPath);
    navigate(dashboardPath, { replace: true });
    
    // Lock navigation for 3 seconds to let things settle
    this.transitionTimeoutId = setTimeout(() => {
      this.isNavigating = false;
      sessionStorage.removeItem('qb_navigation_in_progress');
      console.log('NavigationController: Navigation lock released');
    }, 3000);
  }
  
  // Method to handle QuickBooks disconnect
  public handleDisconnect(userId: string, navigate: Function): void {
    console.log('NavigationController: Handling QuickBooks disconnection');
    
    // Prevent any other navigation during this transition
    this.isNavigating = true;
    
    // Clear any existing transition timeout
    if (this.transitionTimeoutId) {
      clearTimeout(this.transitionTimeoutId);
    }
    
    // Set session flags for disconnect
    sessionStorage.setItem('qb_navigation_in_progress', 'true');
    sessionStorage.setItem('qb_disconnected', 'true');
    sessionStorage.setItem('qb_disconnect_timestamp', Date.now().toString());
    
    // Navigate to authenticate page using environment-aware navigation
    const authenticatePath = navigateWithEnvironment('/authenticate');
    console.log('NavigationController: Navigating to authenticate page after disconnect with path:', authenticatePath);
    navigate(authenticatePath, { 
      replace: true,
      state: { fromDisconnect: true }
    });
    
    // Lock navigation for 3 seconds to let things settle
    this.transitionTimeoutId = setTimeout(() => {
      this.isNavigating = false;
      sessionStorage.removeItem('qb_navigation_in_progress');
      console.log('NavigationController: Navigation lock released after disconnect');
    }, 3000);
  }
  
  // Method to check if navigation is locked
  public isNavigationLocked(): boolean {
    return this.isNavigating || sessionStorage.getItem('qb_navigation_in_progress') === 'true';
  }
}

export const navigationController = NavigationController.getInstance();
