export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { generateToken } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (!user.otp_code || !user.otp_expires_at) {
      return NextResponse.json({ success: false, error: 'No OTP requested' }, { status: 400 })
    }

    if (new Date() > user.otp_expires_at) {
      return NextResponse.json({ success: false, error: 'OTP expired' }, { status: 400 })
    }

    if (user.otp_code !== otp) {
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 })
    }

    await prisma.user.update({
      where: { email },
      data: { otp_code: null, otp_expires_at: null },
    })

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      school_id: user.school_id,
      name: `${user.first_name} ${user.last_name}`,
    })

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'OTP_LOGIN',
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
          school_id: user.school_id,
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
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}