export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/app/lib/prisma'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('token')
    console.log('ME ROUTE - cookie exists:', !!cookie)
    console.log('ME ROUTE - cookie value:', cookie?.value?.substring(0, 30))

    if (!cookie?.value) {
      console.log('ME ROUTE - no cookie found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(cookie.value, SECRET)
    console.log('ME ROUTE - payload:', payload)

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        school_id: true,
        is_active: true,
        avatar_url: true,
        school: { select: { name: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err) {
    console.error('ME ROUTE ERROR:', err)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}