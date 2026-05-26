export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { comparePassword } from '@/app/lib/auth'
import { createAndSendOTP } from '@/app/lib/otp'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.is_active) {
      return NextResponse.json({ success: false, error: 'Account disabled' }, { status: 401 })
    }

    // ── BRUTE FORCE CHECK ──
    if (user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000)
      return NextResponse.json({
        success: false,
        error: `Account locked. Try again in ${minutesLeft} minute(s).`,
        locked: true,
        lockedUntil: user.locked_until,
      }, { status: 423 })
    }

    const valid = await comparePassword(password, user.password_hash)

    if (!valid) {
      const attempts = (user.login_attempts || 0) + 1
      const shouldLock = attempts >= MAX_ATTEMPTS
      await prisma.user.update({
        where: { id: user.id },
        data: {
          login_attempts: attempts,
          locked_until: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
        },
      })
      return NextResponse.json({
        success: false,
        error: shouldLock
          ? `Too many failed attempts. Account locked for ${LOCK_MINUTES} minutes.`
          : `Invalid credentials. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.`,
        locked: shouldLock,
      }, { status: 401 })
    }

    // ── RESET ATTEMPTS ON SUCCESS ──
    await prisma.user.update({
      where: { id: user.id },
      data: { login_attempts: 0, locked_until: null, last_login_at: new Date() },
    })

    // ── PASSWORD EXPIRY CHECK (7 days) — fresh fetch ──
    const freshUser = await prisma.user.findUnique({ where: { id: user.id } })
    const lastChange = freshUser?.last_password_change
    const isExpired = !lastChange ||
      (Date.now() - lastChange.getTime()) > 7 * 24 * 60 * 60 * 1000

    if (isExpired) {
      return NextResponse.json({
        success: false,
        requirePasswordChange: true,
        userId: user.id,
        error: 'Password expired',
      }, { status: 200 })
    }

    // ── OTP ──
    createAndSendOTP(user.id, user.email).catch(err => console.error('OTP send failed:', err))

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'LOGIN_OTP_SENT',
        entity: 'User',
        meta: { email: user.email },
      },
    })

    return NextResponse.json({
      success: true,
      requireOTP: true,
      userId: user.id,
    })

  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}