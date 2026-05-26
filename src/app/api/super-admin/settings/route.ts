export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getUserFromRequest } from "@/app/lib/auth"
import bcrypt from "bcryptjs"
import fs from "fs"
import path from "path"

const SETTINGS_FILE = path.join(process.cwd(), "data", "platform-settings.json")

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true })
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
        site_name: "EduFlow LMS",
        logo_url: "",
        support_email: "support@eduflow.pk",
        notify_new_school: true,
        notify_new_user: true,
        notify_billing: true,
      }))
    }
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"))
  } catch {
    return {
      site_name: "EduFlow LMS",
      logo_url: "",
      support_email: "support@eduflow.pk",
      notify_new_school: true,
      notify_new_user: true,
      notify_billing: true,
    }
  }
}

function writeSettings(data: object) {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true })
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2))
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        avatar_url: true,
        two_fa_enabled: true,
      },
    })

    const platform = readSettings()

    return NextResponse.json({ profile, platform })
  } catch (error) {
    console.error("GET /settings error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type } = body

    // ── Update profile ──────────────────────────────────────────
    if (type === "profile") {
      const { first_name, last_name, email, phone } = body
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(first_name !== undefined && { first_name }),
          ...(last_name  !== undefined && { last_name }),
          ...(email      !== undefined && { email }),
          ...(phone      !== undefined && { phone }),
        },
        select: { id: true, first_name: true, last_name: true, email: true, phone: true },
      })
      return NextResponse.json({ success: true, profile: updated })
    }

    // ── Change password ─────────────────────────────────────────
    if (type === "password") {
      const { current_password, new_password } = body
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password_hash: true },
      })
      if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

      const valid = await bcrypt.compare(current_password, dbUser.password_hash)
      if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })

      const hash = await bcrypt.hash(new_password, 12)
      await prisma.user.update({
        where: { id: user.id },
        data: { password_hash: hash },
      })
      return NextResponse.json({ success: true })
    }

    // ── Platform settings ───────────────────────────────────────
    if (type === "platform") {
      const { site_name, logo_url, support_email } = body
      const current = readSettings()
      writeSettings({ ...current, site_name, logo_url, support_email })
      return NextResponse.json({ success: true })
    }

    // ── Notification settings ───────────────────────────────────
    if (type === "notifications") {
      const { notify_new_school, notify_new_user, notify_billing } = body
      const current = readSettings()
      writeSettings({ ...current, notify_new_school, notify_new_user, notify_billing })
      return NextResponse.json({ success: true })
    }

    // ── Toggle 2FA ──────────────────────────────────────────────
    if (type === "2fa") {
      const { two_fa_enabled } = body
      await prisma.user.update({
        where: { id: user.id },
        data: { two_fa_enabled },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("PUT /settings error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}