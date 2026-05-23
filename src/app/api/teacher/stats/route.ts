export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getUserFromRequest } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const teacher_id = user.id

    const [courses, classes, pendingAssignments, totalStudents] = await Promise.all([
      prisma.course.count({
        where: { author_id: teacher_id, deleted_at: null },
      }),
      prisma.classTeacher.count({
        where: { teacher_id },
      }),
      prisma.assignmentSubmission.count({
        where: {
          status: 'submitted',
          assignment: { course: { author_id: teacher_id } },
        },
      }),
      prisma.enrollment.count({
        where: { course: { author_id: teacher_id } },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: { courses, classes, pendingAssignments, totalStudents },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}