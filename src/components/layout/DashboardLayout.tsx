'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: string
}

export default function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/auth/login')
          return null
        }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar
        role={user?.role}
        userName={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()}
        schoolName={user?.school?.name}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}