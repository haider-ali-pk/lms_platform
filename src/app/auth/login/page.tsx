'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  setError('')

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()
  setLoading(false)

  // Password expired
  if (data.requirePasswordChange) {
    router.push(`/password-expired?userId=${data.userId}`)
    return
  }

  if (!data.success) {
    setError(data.error)
    return
  }

  // OTP required
  if (data.requireOTP) {
    router.push(`/verify-otp?userId=${data.userId}`)
    return
  }

  // 2FA
  if (data.requires2FA) {
    router.push(`/verify-2fa?userId=${data.userId}`)
    return
  }
  localStorage.setItem('user', JSON.stringify(data.user))

  const role = data.user.role
  if (role === 'super_admin') router.push('/super-admin/dashboard')
  else if (role === 'admin') router.push('/admin/dashboard')
  else if (role === 'teacher') router.push('/teacher/dashboard')
  else if (role === 'student') router.push('/student/dashboard')
  else if (role === 'parent') router.push('/parent/dashboard')
  else router.push('/super-admin/dashboard')
}
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4F46E5] rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">EduFlow LMS</h1>
          <p className="text-[#64748B] mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F46E5] text-white py-3 rounded-xl font-medium hover:bg-[#4338CA] transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E2E8F0]">
            <p className="text-center text-sm text-[#64748B] mb-3">Login with OTP instead</p>
            <button
              onClick={() => router.push('/auth/login-otp')}
              className="w-full border border-[#4F46E5] text-[#4F46E5] py-3 rounded-xl font-medium hover:bg-[#EEF2FF] transition-colors"
            >
              Send OTP to email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
