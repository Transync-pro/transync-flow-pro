
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Constants for login security
const MAX_LOGIN_ATTEMPTS = 8;
const LOCKOUT_DURATION_MINUTES = 30;
const VELOCITY_THRESHOLD_ATTEMPTS = 5;
const VELOCITY_THRESHOLD_SECONDS = 60;
const ARTIFICIAL_DELAY_MS = 2500;

/**
 * Check if a user is locked out and handle login attempts
 * @param userIdentifier Email or user identifier to check
 * @param succeeded Whether the login attempt was successful
 * @returns Boolean indicating if the user is allowed to proceed
 */
export async function processLoginAttempt(
  userIdentifier: string,
  succeeded: boolean
): Promise<boolean> {
  try {
    // Get client IP if available (will be empty in some environments)
    const clientIp = ""; // In a real app, you'd get this from the request
    
    // Apply a small consistent delay for all requests to mitigate timing attacks
    // This helps prevent username enumeration via timing differences
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if account is locked
    const { data: lockData, error: lockError } = await supabase
      .from("login_security")
      .select("locked_until, attempt_count, last_attempt_at")
      .eq("user_identifier", userIdentifier)
      .order("last_attempt_at", { ascending: false })
      .limit(1)
      .single();
    
    if (lockError && lockError.code !== "PGRST116") {
      // Log the error but don't block login (fail open for DB errors)
      console.error("Error checking login security:", lockError);
      return true;
    }
    
    // Check if the account is locked
    if (lockData?.locked_until && new Date(lockData.locked_until) > new Date()) {
      console.log(`Account ${userIdentifier} is locked until ${lockData.locked_until}`);
      
      // Still update the record to track persistent attempts during lockout
      await supabase
        .from("login_security")
        .upsert({
          user_identifier: userIdentifier,
          ip_address: clientIp || null,
          attempt_count: (lockData.attempt_count || 0) + 1,
          last_attempt_at: new Date().toISOString(),
          locked_until: lockData.locked_until
        })
        .select();
      
      return false;
    }
    
    // If the login was successful, reset the attempt counter
    if (succeeded) {
      if (lockData) {
        await supabase
          .from("login_security")
          .upsert({
            user_identifier: userIdentifier,
            ip_address: clientIp || null,
            attempt_count: 0,
            last_attempt_at: new Date().toISOString(),
            locked_until: null
          })
          .select();
      }
      return true;
    }
    
    // Handle failed login attempt
    let newAttemptCount = 1;
    let shouldDelay = false;
    
    if (lockData) {
      newAttemptCount = (lockData.attempt_count || 0) + 1;
      
      // Check for velocity attack (multiple attempts in a short period)
      const lastAttemptTime = new Date(lockData.last_attempt_at).getTime();
      const currentTime = new Date().getTime();
      const timeDiffSeconds = (currentTime - lastAttemptTime) / 1000;
      
      if (newAttemptCount >= VELOCITY_THRESHOLD_ATTEMPTS && 
          timeDiffSeconds <= VELOCITY_THRESHOLD_SECONDS) {
        shouldDelay = true;
        console.log(`Velocity check triggered for ${userIdentifier}: ${newAttemptCount} attempts in ${timeDiffSeconds}s`);
      }
    }
    
    // Calculate lock duration if attempts exceeded
    let lockedUntil = null;
    if (newAttemptCount >= MAX_LOGIN_ATTEMPTS) {
      const lockDate = new Date();
      lockDate.setMinutes(lockDate.getMinutes() + LOCKOUT_DURATION_MINUTES);
      lockedUntil = lockDate.toISOString();
      console.log(`Locking account ${userIdentifier} until ${lockedUntil}`);
    }
    
    // Update or insert the login security record
    await supabase
      .from("login_security")
      .upsert({
        user_identifier: userIdentifier,
        ip_address: clientIp || null,
        attempt_count: newAttemptCount,
        last_attempt_at: new Date().toISOString(),
        locked_until: lockedUntil
      })
      .select();
    
    // Apply artificial delay if velocity check triggered
    if (shouldDelay) {
      await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY_MS));
    }
    
    // Return false if account is now locked
    return lockedUntil === null;
  } catch (error) {
    // Log error but don't block login (fail open)
    console.error("Error in login security check:", error);
    return true;
  }
}
