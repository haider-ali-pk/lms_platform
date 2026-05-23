export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getUserFromRequest } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const totalSchools = await prisma.school.count()

    const allUsers = await prisma.user.findMany({
      select: { role: true },
    })

    const totalUsers = allUsers.length
    const totalStudents = allUsers.filter((u: any) => String(u.role) === 'student').length
const totalTeachers = allUsers.filter((u: any) => String(u.role) === 'teacher').length

    return NextResponse.json({
      success: true,
      data: {
        totalSchools,
        totalUsers,
        totalStudents,
        totalTeachers,
      },
    })
  } catch (err) {
    console.error('STATS ERROR:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}