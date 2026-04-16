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

export const supabase = createClient(
    supabaseUrl || "https://placeholder-project.supabase.co",
    supabaseKey || "missing-supabase-key",
    {
        auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        },
    })
