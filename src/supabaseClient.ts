import { createClient } from "@supabase/supabase-js";

// --- REPLACE THESE VALUES WITH YOUR SUPABASE PROJECT DETAILS ---
const SUPABASE_URL = "https://kasjghfuorswuitigcrp.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_vren8ESwoJNJErTb3kO9DA_c79-KOkw";
// ---------------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
