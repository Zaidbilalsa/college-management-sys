import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for interacting with your database
// Replace these with your actual Supabase URL and anon key when you integrate
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
