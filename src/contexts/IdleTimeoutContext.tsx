
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
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(WARNING_DURATION / 1000);
  
  // Reset timer function - called ONLY when the Keep Me Logged In button is clicked
  // This should not be called by general user activity
  const resetTimer = useCallback(() => {
    setIsIdle(false);
    setShowWarning(false);
  }, []);
  
  // Handle the idle timer
  useEffect(() => {
    if (!user) return; // Only track idle time for authenticated users
    
    let idleTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    
    const startIdleTimer = () => {
      // Clear any existing timers
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);
      
      // Set a new idle timer
      idleTimer = setTimeout(() => {
        console.log('User idle detected - showing warning');
        setIsIdle(true);
        setShowWarning(true);
        
        // Set a warning timer for logout
        warningTimer = setTimeout(() => {
          console.log('Warning timer expired - logging out user');
          // Log the user out when warning timer expires
          // Add a small delay to ensure the state update completes
          setTimeout(() => {
            toast({
              title: "Session Expired",
              description: "You have been logged out due to inactivity.",
              variant: "destructive"
            });
            // Hide the warning dialog before signing out
            setShowWarning(false);
            // Force logout after timer expires
            signOut();
          }, 100);
        }, WARNING_DURATION);
      }, IDLE_TIMEOUT);
    };
    
    // Start the timer initially
    startIdleTimer();
    
    // Reset the timer when user becomes active again, but ONLY when not in warning state
    // This ensures the warning can only be dismissed by the Keep Me Logged In button
    if (!isIdle) {
      startIdleTimer();
    }
    
    // Cleanup timers on unmount
    return () => {
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);
    };
  }, [user, isIdle, signOut, toast]);
  
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
            console.log('Session expired - logging out user');
            // Add a small delay to ensure the state update completes
            setTimeout(() => {
              toast({
                title: "Session Expired",
                description: "You have been logged out due to inactivity.",
                variant: "destructive"
              });
              // Hide the warning dialog before signing out
              setShowWarning(false);
              // Force logout
              signOut();
            }, 100);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [showWarning, user, signOut, toast]);
  
  // Track user activity to start the idle timer, but not reset it
  // The timer should only be reset by clicking the "Keep Me Logged In" button
  useEffect(() => {
    if (!user) return; // Only track activity for authenticated users
    
    // We no longer reset the timer on general user activity
    // The idle timer will start when the component mounts and only the explicit
    // button click in the warning dialog will reset it
    
    // We also don't reset on tab visibility changes anymore
    // This ensures the logout flow isn't interrupted by tab switching
    
    // No event listeners needed since we don't reset on general activity
  }, [user]);
  
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
