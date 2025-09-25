import React, { createContext, useContext, useEffect, useState } from 'react'

type User = { email: string } | null

type AuthContextType = {
  user: User
  login: (email: string, password: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('kyariUser')
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  function login(email: string, _password: string) {
    const u = { email }
    setUser(u)
    try {
      localStorage.setItem('kyariUser', JSON.stringify(u))
    } catch {
      // ignore
    }
  }

  function logout() {
    setUser(null)
    try {
      localStorage.removeItem('kyariUser')
    } catch {
      // ignore
    }
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
