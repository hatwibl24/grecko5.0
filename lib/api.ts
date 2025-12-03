import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';

/**
 * Invokes a Supabase Edge Function with automatic auth header injection.
 * 
 * @param functionName - The name of the Edge Function (e.g., 'ai-assistant', 'grecko-ai')
 * @param body - The JSON payload to send
 * @returns The JSON response data
 */
export const invokeEdgeFunction = async (functionName: string, body: any) => {
  try {
    // 1. Force a session check. This refreshes the token if expired.
    const { data: { session }, error: sessionError } = await (supabase.auth as any).getSession();

    if (sessionError || !session) {
      console.warn(`[API] No active session for ${functionName}.`);
      throw new Error("Please login to use this feature.");
    }

    const token = session.access_token;
    
    // 2. Construct URL
    const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;

    // 3. Make the Request
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify(body),
    });

    // 4. Handle Errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Not JSON
      }
      
      const errorMessage = errorJson?.error || errorText || `Error ${response.status}`;
      console.error(`[API] Edge Function '${functionName}' failed:`, errorMessage);
      throw new Error(errorMessage);
    }

    // 5. Return Data
    const data = await response.json();
    return data;

  } catch (error: any) {
    console.error(`[API] Invocation failed:`, error.message);
    throw error;
  }
};