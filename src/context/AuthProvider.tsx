import { supabase } from "@/lib/supabase/client";
import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";


interface User {
    id: string;
    email: string;
    password?: string;
    username?: string;
    name?: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: User | null;
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateUserProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        getSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getSession = async () => {
        try {
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
                const profile = await fetchUserProfile(data.session.user.id);
                if (profile) {
                    setUser(profile);
                }
                else setUser(null);
            }
        } catch (error) {
            Alert.alert("Error getting session", (error as Error).message);
            setUser(null);
        }
    }

    const updateUserProfile = async (userData: Partial<User>) => {
        if (!user) throw new Error("No user logged in");
        
        const update: any = {
            ...userData,
            id: user.id,
            email: user.email // Include email to satisfy NOT NULL constraint
        }

        const { error } = await supabase.from('profiles').upsert(update);
        
        if (error) {
            console.error("Profile update error:", error, "Update payload:", update);
            throw error;
        }

        setUser((prev) => prev ? { ...prev, ...userData } : null);
    }

    const fetchUserProfile = async (userId: string): Promise<User | null> => {
        try {
            const { data, error } = await supabase.from('profiles').select("*").eq("id", userId).single();
            if (error) {
                Alert.alert("Error fetching user profile", error.message);
                return null;
            }

            if (!data) {
                console.log("No user profile found");
                return null;
            }

            const authUser = await supabase.auth.getUser();
            if (authUser.error) {
                Alert.alert("Error fetching auth user", authUser.error.message);
                return null;
            }

            return {
                id: data.id,
                email: authUser.data.user?.email || "",
                username: data.username || "",
                name: data.name || "",
                avatar_url: data.avatar_url || "",

            }
        } catch (error) {
            console.log("Error fetching user profile", error);
            return null;
        }
    }

    const signUp = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            })

            if (error) {
                Alert.alert("Error signing up", error.message);
            }
            if (data?.user) {
                const profile = await fetchUserProfile(data.user.id);
                if (profile) {
                    setUser(profile);
                }
            }

        } catch (error) {
            console.log("Error signing up", error);
            Alert.alert("Error signing up", (error as Error).message);
        }
    }

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                Alert.alert("Error signing in", error.message);
            }

            if (data?.user) {
                const profile = await fetchUserProfile(data.user.id);
                if (profile) {
                    setUser(profile);
                }
            }
        } catch (error) {
            Alert.alert("Error signing in", (error as Error).message);
        }
    }

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            console.log("User signed out");

            if (error) {
                Alert.alert("Error signing out", error.message);
            }
        } catch (error) {
            Alert.alert("Error signing out", (error as Error).message);
        }
    }

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, signOut, updateUserProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {

    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}