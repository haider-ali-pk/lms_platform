export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getUserFromRequest } from "@/app/lib/auth"

// GET — fetch all notifications (platform-wide)
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = 20
    const skip = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { first_name: true, last_name: true, email: true, role: true }
          },
          school: {
            select: { name: true }
          }
        }
      }),
      prisma.notification.count()
    ])

    const unread = await prisma.notification.count({
      where: { is_read: false }
    })

    return NextResponse.json({ notifications, total, unread, page })
  } catch (error) {
    console.error("GET /notifications error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// POST — send a notification (broadcast or to specific school)
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, body, type, scope, school_id } = await req.json()

    if (!title || !body || !type || !scope) {
      return NextResponse.json({ error: "title, body, type, scope are required" }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        body,
        type,
        scope: scope === "school" ? `school:${school_id}` : "all",
        school_id: scope === "school" ? school_id : null,
        user_id: undefined,   // ← fixes "null not assignable" error
        is_read: false,
      }
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error("POST /notifications error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// PATCH — mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.notification.updateMany({
      where: { is_read: false },
      data: { is_read: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PATCH /notifications error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}