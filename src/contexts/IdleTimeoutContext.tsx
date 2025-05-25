
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Constants
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_DURATION = 2 * 60 * 1000; // 2 minutes
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
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(WARNING_DURATION / 1000);
  
  // Use refs to store timer IDs to avoid dependency issues
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  
  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);
  
  // Start the idle timer
  const startIdleTimer = useCallback(() => {
    // Clear any existing timers first
    clearAllTimers();
    
    // Reset state
    setIsIdle(false);
    setShowWarning(false);
    setRemainingTime(WARNING_DURATION / 1000);
    
    // Set the idle timer
    idleTimerRef.current = setTimeout(() => {
      console.log('User idle detected - showing warning');
      setIsIdle(true);
      setShowWarning(true);
      
      // Start the warning countdown
      let secondsLeft = WARNING_DURATION / 1000;
      
      countdownIntervalRef.current = setInterval(() => {
        secondsLeft -= 1;
        setRemainingTime(secondsLeft);
        
        if (secondsLeft <= 0) {
          // Clear the interval
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          
          // Log the user out
          console.log('Warning timer expired - logging out user');
          toast({
            title: "Session Expired",
            description: "You have been logged out due to inactivity.",
            variant: "destructive"
          });
          
          // Hide the warning dialog and sign out
          setShowWarning(false);
          signOut();
        }
      }, 1000);
      
    }, IDLE_TIMEOUT);
    
    lastActivityTimeRef.current = Date.now();
  }, [clearAllTimers, signOut, toast]);
  
  // Reset timer function - called when the Keep Me Logged In button is clicked
  const resetTimer = useCallback(() => {
    console.log('Timer manually reset by user');
    startIdleTimer();
  }, [startIdleTimer]);
  
  // Initialize timer when user logs in
  useEffect(() => {
    if (!user) return;
    
    console.log('Initializing idle timer for authenticated user');
    startIdleTimer();
    
    // Clean up on unmount or when user logs out
    return clearAllTimers;
  }, [user, startIdleTimer, clearAllTimers]);
  
  // Track user activity
  useEffect(() => {
    if (!user) return;
    
    const handleActivity = (e: Event) => {
      // If warning is showing, don't reset automatically
      if (showWarning) return;
      
      const now = Date.now();
      
      // Throttle mousemove events
      if (e.type === 'mousemove') {
        const now = Date.now();
        if (now - lastActivityTimeRef.current < MOUSE_MOVE_THROTTLE) return; // Use the defined throttle constant
        lastActivityTimeRef.current = now;
      }
      
      // Update last activity time
      lastActivityTimeRef.current = now;
      
      // Reset the timer
      startIdleTimer();
    };
    
    // Add event listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);
    
    return () => {
      // Remove event listeners on cleanup
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user, showWarning, startIdleTimer]);
  
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
