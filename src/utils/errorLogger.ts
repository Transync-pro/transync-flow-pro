
import { supabase } from "@/integrations/supabase/client";

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

// Error log entry interface
export interface ErrorLogEntry {
  timestamp: string;
  message: string;
  source: string;
  stack?: string;
  context?: Record<string, any>;
  user_id?: string | null;
  severity: ErrorSeverity;
}

// In-memory store for errors (useful for debugging in development)
const errorLog: ErrorLogEntry[] = [];
let consoleErrorEnabled = true;
let persistToDbEnabled = false;

/**
 * Logs an error to the console and optionally to the database
 */
export const logError = async (
  message: string, 
  options: {
    source: string;
    stack?: string;
    context?: Record<string, any>;
    user_id?: string | null;
    severity?: ErrorSeverity;
    consoleLog?: boolean;
    persistToDb?: boolean;
  }
) => {
  const { 
    source,
    stack, 
    context, 
    user_id, 
    severity = ErrorSeverity.MEDIUM,
    consoleLog = consoleErrorEnabled,
    persistToDb = persistToDbEnabled
  } = options;

  const entry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    message,
    source,
    stack,
    context,
    user_id,
    severity
  };

  // Add to in-memory log
  errorLog.push(entry);
  
  // Log to console if enabled
  if (consoleLog) {
    console.error(`[${entry.source}] ${entry.message}`, {
      timestamp: entry.timestamp,
      severity: entry.severity,
      context: entry.context,
      stack: entry.stack,
      user_id: entry.user_id
    });
  }
  
  // Persist to database if enabled
  if (persistToDb) {
    try {
      // Get current user if no user_id is provided
      if (!user_id) {
        const { data } = await supabase.auth.getUser();
        entry.user_id = data?.user?.id;
      }
      
      // Store in error_logs table (you'll need to create this table)
      await supabase.from('error_logs').insert({
        timestamp: entry.timestamp,
        message: entry.message,
        source: entry.source,
        stack: entry.stack,
        context: entry.context,
        user_id: entry.user_id,
        severity: entry.severity
      });
    } catch (err) {
      // Don't log this error to prevent infinite loops
      console.error('Failed to persist error log to database:', err);
    }
  }
  
  return entry;
};

/**
 * Get the error log
 */
export const getErrorLog = () => [...errorLog];

/**
 * Clear the error log
 */
export const clearErrorLog = () => {
  errorLog.length = 0;
};

/**
 * Configure error logging settings
 */
export const configureErrorLogger = (options: {
  consoleEnabled?: boolean;
  persistToDbEnabled?: boolean;
}) => {
  if (options.consoleEnabled !== undefined) {
    consoleErrorEnabled = options.consoleEnabled;
  }
  if (options.persistToDbEnabled !== undefined) {
    persistToDbEnabled = options.persistToDbEnabled;
  }
};
