"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Define a type for our custom user profile data
interface UserProfile {
  subscription_tier?: string
  full_name?: string
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""

  useEffect(() => {
    // Function to fetch the initial user session
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile, error } = await supabase
            .from("users")
            .select("subscription_tier, full_name")
            .eq("id", user.id)
            .single()

          if (error) {
            console.error("Error fetching user profile:", error)
            setUserProfile(null)
          } else {
            setUserProfile(profile)
          }
        } else {
          setUserProfile(null)
        }
      } catch (e) {
        console.error("An error occurred during session fetch:", e)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // This event is handled by the update-password page.
        // We don't want to set the user here, as it will trigger an immediate redirect.
        return
      }

      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!loading && user) {
      // If the user is on the root or an auth page (but not the update-password page),
      // redirect them to the dashboard.
      if (
        pathname === "/" ||
        (pathname.startsWith("/auth") && pathname !== "/auth/update-password")
      ) {
        router.push("/dashboard")
      }
    }
  }, [user, loading, pathname, router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}