import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");

let _browser: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

// Browser/RSC client — anon key, public reads only.
export function sbBrowser(): SupabaseClient {
  if (!ANON) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  if (!_browser) {
    _browser = createClient(URL!, ANON, {
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
  if (!SERVICE) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  if (!_admin) {
    _admin = createClient(URL!, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}
