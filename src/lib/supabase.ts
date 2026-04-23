import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _browser: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

// Browser/RSC client — anon key, public reads only.
export function sbBrowser(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  if (!_browser) {
    _browser = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _browser;
}

// Server-only admin client — service role key, bypasses RLS.
// Never import this into client components.
export function sbAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("sbAdmin() must only be called on the server");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!service) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  if (!_admin) {
    _admin = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}
