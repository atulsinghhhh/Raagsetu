import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseKey)

if (!hasSupabaseEnv) {
    console.error(
        "Supabase environment variables are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in your EAS environment."
    )
}

// During static web rendering (SSR in Node.js), `window` is not defined and
// AsyncStorage / GoTrueClient crash. Use typeof window for safer SSR detection.
const isSSR = typeof window === 'undefined';

export const supabase = createClient(
    supabaseUrl || "https://placeholder-project.supabase.co",
    supabaseKey || "missing-supabase-key",
    {
        auth: {
        storage: isSSR ? undefined : AsyncStorage,
        autoRefreshToken: !isSSR,
        persistSession: !isSSR,
        detectSessionInUrl: false,
        },
    })


