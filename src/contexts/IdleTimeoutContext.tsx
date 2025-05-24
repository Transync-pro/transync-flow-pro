import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Constants
const IDLE_TIMEOUT = 1 * 60 * 1000; // 1 minute for testing (normally 10 minutes)
const WARNING_DURATION = 30 * 1000; // 30 seconds for testing (normally 2 minutes)
const MOUSE_MOVE_THROTTLE = 15 * 1000; // 15 seconds throttle for mouse movement

interface IdleTimeoutContextType {
  isIdle: boolean;
  showWarning: boolean;
  remainingTime: number;
  resetTimer: () => void;
}

const IdleTimeoutContext = createContext<IdleTimeoutContextType | null>(null);

export const useIdleTimeout = () => {
  const context = useContext(IdleTimeoutContext);
  if (!context) {
    throw new Error('useIdleTimeout must be used within an IdleTimeoutProvider');
  }
  return context;
};

interface IdleTimeoutProviderProps {
  children: ReactNode;
}

export const IdleTimeoutProvider: React.FC<IdleTimeoutProviderProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(WARNING_DURATION / 1000);
  
  // Reset timer function - called when user activity is detected
  const resetTimer = useCallback(() => {
    setIsIdle(false);
    setShowWarning(false);
  }, []);
  
  // Handle the idle timer
  useEffect(() => {
    if (!user) return; // Only track idle time for authenticated users
    
    let idleTimer: number;
    let warningTimer: number;
    
    const startIdleTimer = () => {
      // Clear any existing timers
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);
      
      // Set a new idle timer
      idleTimer = setTimeout(() => {
        setIsIdle(true);
        setShowWarning(true);
        
        // Set a warning timer for logout
        warningTimer = setTimeout(() => {
          // Log the user out when warning timer expires
          toast({
            title: "Session Expired",
            description: "You have been logged out due to inactivity.",
            variant: "destructive"
          });
          // Force logout after timer expires
          logout();
        }, WARNING_DURATION);
      }, IDLE_TIMEOUT);
    };
    
    // Start the timer initially
    startIdleTimer();
    
    // Reset the timer when user becomes active again
    if (!isIdle) {
      startIdleTimer();
    }
    
    // Cleanup timers on unmount
    return () => {
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);
    };
  }, [user, isIdle, logout, toast]);
  
  // Handle the countdown timer for the warning dialog
  useEffect(() => {
    if (!showWarning) {
      setRemainingTime(WARNING_DURATION / 1000);
      return;
    }
    
    const countdownInterval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Force logout when timer reaches zero
          if (user) {
            toast({
              title: "Session Expired",
              description: "You have been logged out due to inactivity.",
              variant: "destructive"
            });
            logout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [showWarning, user, logout, toast]);
  
  // Track user activity - only specific actions should reset the timer
  useEffect(() => {
    if (!user) return; // Only track activity for authenticated users
    
    const resetTimerOnActivity = () => resetTimer();
    
    // Add event listeners for user activity - only button clicks and form interactions
    // Mouse movement will NOT reset the timer as requested
    window.addEventListener('mousedown', resetTimerOnActivity);
    window.addEventListener('keydown', resetTimerOnActivity);
    window.addEventListener('touchstart', resetTimerOnActivity);
    window.addEventListener('click', resetTimerOnActivity);
    window.addEventListener('scroll', resetTimerOnActivity, { passive: true });
    
    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('mousedown', resetTimerOnActivity);
      window.removeEventListener('keydown', resetTimerOnActivity);
      window.removeEventListener('touchstart', resetTimerOnActivity);
      window.removeEventListener('click', resetTimerOnActivity);
      window.removeEventListener('scroll', resetTimerOnActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, resetTimer]);
  
  const value: IdleTimeoutContextType = {
    isIdle,
    showWarning,
    remainingTime,
    resetTimer
  };
  
  return (
    <IdleTimeoutContext.Provider value={value}>
      {children}
    </IdleTimeoutContext.Provider>
  );
};
