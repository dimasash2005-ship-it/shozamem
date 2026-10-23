import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

let browserClient: SupabaseClient | null = null;

// Для браузера: один клієнт на весь застосунок, пам'ятає вхід
export function supabaseBrowser(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (!browserClient) browserClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  return browserClient;
}

// Для сервера: лише читання публічних мемів
export function supabaseServer(): SupabaseClient | null {
  if (!hasSupabase) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

export function publicUrl(path: string | null | undefined): string | null {
  if (!path || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/memes/${path}`;
}
