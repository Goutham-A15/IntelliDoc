// lib/api-client.ts
import { createClient } from "@/lib/supabase/client";

// Central function for making authenticated API calls to the Express backend.
export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers || {});

  // Add the JWT to the Authorization header for protected routes
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  // Only set Content-Type if the body is not FormData and method has a body
  if (!(options.body instanceof FormData) && options.method && options.method.toUpperCase() !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  // Build base URL with a safe fallback to '/api'
  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
  const baseUrl = rawBase.replace(/\/$/, ""); // remove trailing slash
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // try to parse returned error JSON, but fall back to status text
    let errorMsg = "API request failed";
    try {
      const errData = await response.json();
      errorMsg = errData?.error || JSON.stringify(errData) || response.statusText;
    } catch (e) {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  return response;
}
