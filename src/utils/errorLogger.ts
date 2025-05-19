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
      let userId = user_id;
      if (!userId) {
        const { data } = await supabase.auth.getUser();
        userId = data?.user?.id;
      }
      
      // Store in operation_logs table instead of error_logs
      // Adjusted to use the fields available in operation_logs table
      // Using 'fetch' as the operation_type since it's a valid value
      await supabase.from('operation_logs').insert({
        operation_type: 'fetch',  // Changed from 'error' to 'fetch' to comply with constraint
        entity_type: source,
        record_id: null,
        status: 'error',  // Indicate it's an error in the status field
        details: {
          message,
          timestamp: entry.timestamp,
          severity,
          stack,
          context
        },
        user_id: userId
        // created_at will be automatically set by the database default
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
