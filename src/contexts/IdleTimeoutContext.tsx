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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [showWarning]);
  
  // Track user activity
  useEffect(() => {
    if (!user) return; // Only track activity for authenticated users
    
    const resetTimerOnActivity = () => resetTimer();
    
    // Add event listeners for user activity
    window.addEventListener('mousedown', resetTimerOnActivity);
    window.addEventListener('keydown', resetTimerOnActivity);
    window.addEventListener('touchstart', resetTimerOnActivity);
    window.addEventListener('click', resetTimerOnActivity);
    window.addEventListener('scroll', resetTimerOnActivity, { passive: true });
    
    // Heavily throttled mouse movement detection
    let lastMovementTime = Date.now();
    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMovementTime > MOUSE_MOVE_THROTTLE) {
        lastMovementTime = now;
        resetTimer();
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
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
      window.removeEventListener('mousemove', handleMouseMove);
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
