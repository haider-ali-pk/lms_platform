export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { createAndSendOTP, checkResendLimit } from '@/app/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const canResend = await checkResendLimit(userId)
    if (!canResend) {
      return NextResponse.json(
        { error: 'Too many resend attempts. Try again in 1 hour.' },
        { status: 429 }
      )
    }

    await createAndSendOTP(userId, user.email)

    return NextResponse.json({ success: true, message: 'OTP sent' })
  } catch (err) {
    console.error('RESEND OTP ERROR:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}