export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { comparePassword, generateToken } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    console.log('LOGIN ATTEMPT:', email)

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    console.log('USER FOUND:', !!user, 'IS_ACTIVE:', user?.is_active)

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.is_active) {
      return NextResponse.json({ success: false, error: 'Account disabled' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password_hash)
    console.log('PASSWORD VALID:', valid)

    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    if (user.two_fa_enabled) {
      return NextResponse.json({
        success: true,
        data: { requires2FA: true, userId: user.id },
      })
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id,
      name: `${user.first_name} ${user.last_name}`,
    })

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'LOGIN',
        entity: 'User',
        meta: { email: user.email },
      },
    })

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          schoolId: user.school_id,
        },
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}