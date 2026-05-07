import { createClient } from "@supabase/supabase-js";

// --- Configuration ---
// These default to the values you provided, but can be overridden in .env
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || "https://kasjghfuorswuitigcrp.supabase.co";
const SUPABASE_PUBLIC_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "sb_publishable_vren8ESwoJNJErTb3kO9DA_c79-KOkw";
// --------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
