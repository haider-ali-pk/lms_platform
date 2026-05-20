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
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!stored || !token) {
      router.push('/auth/login')
      return
    }

    const parsed = JSON.parse(stored)

    if (requiredRole && parsed.role !== requiredRole) {
      router.push('/auth/login')
      return
    }

    setUser(parsed)
    setLoading(false)
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
        userName={user?.name}
        schoolName={user?.school?.name}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}