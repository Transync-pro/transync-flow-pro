/**
 * Generates a cryptographically secure random string for PKCE code verifier
 * @returns A random string of 43-128 characters
 */
export const generateCodeVerifier = (): string => {
  const array = new Uint8Array(56);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
};

/**
 * Generates a code challenge from a code verifier using SHA-256
 * @param codeVerifier The code verifier to generate the challenge from
 * @returns A base64url encoded string
 */
export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
};

/**
 * Encodes a buffer as base64url string
 * @param buffer The buffer to encode
 * @returns A base64url encoded string
 */
function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(buffer)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
