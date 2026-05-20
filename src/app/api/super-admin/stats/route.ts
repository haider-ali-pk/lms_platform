export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getUserFromRequest } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [totalSchools, totalUsers, totalStudents, totalTeachers] = await Promise.all([
      prisma.school.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
    ])

    return NextResponse.json({ success: true, data: { totalSchools, totalUsers, totalStudents, totalTeachers } })
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}