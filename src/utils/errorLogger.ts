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
): Promise<void> => {
  const { 
    source,
    stack,
    context,
    user_id,
    severity = ErrorSeverity.MEDIUM,
    consoleLog = consoleErrorEnabled,
    persistToDb = persistToDbEnabled
  } = options;
  
  // Create the error entry
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
    console.error(`[${entry.timestamp}] [${severity}] [${source}]: ${message}`);
    if (stack) {
      console.error(stack);
    }
    if (context) {
      console.error('Context:', context);
    }
  }
  
  // Persist to database if enabled
  if (persistToDb && supabase) {
    try {
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
        user_id: user_id || 'system'
      });
    } catch (error) {
      // Don't throw here to avoid cascading errors
      console.error('Failed to persist error to database:', error);
    }
  }
};

/**
 * Get the error log
 */
export const getErrorLog = (): ErrorLogEntry[] => {
  return [...errorLog];
};

/**
 * Clear the error log
 */
export const clearErrorLog = (): void => {
  errorLog.length = 0;
  console.log('Error log cleared');
};

/**
 * Configure error logging settings
 */
export const configureErrorLogger = (options: {
  consoleEnabled?: boolean;
  persistToDbEnabled?: boolean;
}): void => {
  if (options.consoleEnabled !== undefined) {
    consoleErrorEnabled = options.consoleEnabled;
  }
  
  if (options.persistToDbEnabled !== undefined) {
    persistToDbEnabled = options.persistToDbEnabled;
  }
  
  console.log(`Error logger configured: console=${consoleErrorEnabled}, persistToDb=${persistToDbEnabled}`);
};
