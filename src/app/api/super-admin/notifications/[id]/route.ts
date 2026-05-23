export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getUserFromRequest } from "@/app/lib/auth"

// PATCH — edit title + body of a specific notification
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, body } = await req.json()

    if (!title || !body) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 })
    }

    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { title, body }
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("PATCH /notifications/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE — remove a specific notification
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.notification.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /notifications/[id] error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}