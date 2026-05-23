export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getUserFromRequest } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const school_id = user.school_id

    const [teachers, students, parents, courses, classes] = await Promise.all([
      prisma.user.count({ where: { school_id, role: 'teacher', deleted_at: null } }),
      prisma.user.count({ where: { school_id, role: 'student', deleted_at: null } }),
      prisma.user.count({ where: { school_id, role: 'parent', deleted_at: null } }),
      prisma.course.count({ where: { school_id, is_published: true, deleted_at: null } }),
      prisma.class.count({ where: { school_id } }),
    ])

    return NextResponse.json({
      success: true,
      data: { teachers, students, parents, courses, classes },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}