import { createClient } from "@/lib/supabase/client";

// This is our central function for making authenticated API calls to the Express backend.
export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers = new Headers(options.headers || {});
  
  // Add the JWT to the Authorization header for protected routes
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  // Only set Content-Type if the body is not FormData
  if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'API request failed');
  }

  return response;
}