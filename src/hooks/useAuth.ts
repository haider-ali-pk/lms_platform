'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  school_id: string | null
  school?: { name: string }
}

export function useAuth(requiredRole?: string) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/auth/login'); return null }
        return res.json()
      })
      .then(data => {
        if (!data) return
        if (requiredRole && data.role !== requiredRole) {
          router.push('/auth/login')
          return
        }
        setUser(data)
        setLoading(false)
      })
      .catch(() => router.push('/auth/login'))
  }, [])

  return { user, loading }
}