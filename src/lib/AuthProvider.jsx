import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = cargando, null = sin sesion
  const [profile, setProfile] = useState(undefined) // undefined = cargando, null = sin perfil (dominio no autorizado)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (!session) { setProfile(null); return }
    setProfile(undefined)
    supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setProfile(data ?? null))
  }, [session])

  const signInWithGoogle = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { queryParams: { hd: 'rentandes.com' }, redirectTo: window.location.origin },
  })

  const signOut = () => supabase.auth.signOut()

  const loading = session === undefined || (session && profile === undefined)
  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{ session, profile, loading, isAdmin, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
