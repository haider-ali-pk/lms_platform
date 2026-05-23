export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!

    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      role: string
    }

    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const studentId = decoded.userId

    const [
      enrollments,
      lessonsCompleted,
      quizAttempts,
      assignmentsPending,
      attendance,
      aiChats,
    ] = await Promise.all([

      prisma.enrollment.count({
        where: { student_id: studentId },
      }),

      prisma.lessonProgress.count({
        where: { student_id: studentId, is_completed: true },
      }),

      prisma.quizAttempt.findMany({
        where: { student_id: studentId },
        select: { score: true },
      }),

      prisma.assignmentSubmission.count({
        where: { student_id: studentId, marks: null },
      }),

      prisma.attendance.findMany({
        where: { student_id: studentId },
        select: { status: true },
      }),

      prisma.aiChatHistory.count({
        where: { student_id: studentId },
      }),

    ])

    const avgScore =
      quizAttempts.length > 0
        ? Math.round(
            quizAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) /
              quizAttempts.length
          )
        : 0

    const attendancePercent =
      attendance.length > 0
        ? Math.round(
            (attendance.filter((a) => a.status === 'present').length /
              attendance.length) *
              100
          )
        : 0

    return NextResponse.json({
      enrolledCourses:    enrollments,
      lessonsCompleted,
      quizAvgScore:       avgScore,
      assignmentsPending,
      attendancePercent,
      aiTutorChats:       aiChats,
    })

  } catch (error) {
    console.error('Student stats error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}