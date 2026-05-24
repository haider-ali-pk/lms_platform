export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const student = await prisma.user.findFirst({
    where: {
      id,
      school_id: user.school_id,
      role: "student",
      deleted_at: null,
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      is_active: true,
      avatar_url: true,
      created_at: true,
      enrollments: {
        where: { course: { school_id: user.school_id } },
        select: {
          id: true,
          enrolled_at: true,
          completed_at: true,
          course: {
            select: {
              id: true,
              title: true,
              is_published: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json({ student });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const { first_name, last_name, email, password, phone, is_active } = body;

  const existing = await prisma.user.findFirst({
    where: {
      id,
      school_id: user.school_id,
      role: "student",
      deleted_at: null,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (first_name) updateData.first_name = first_name;
  if (last_name) updateData.last_name = last_name;
  if (email) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (password) updateData.password_hash = await bcrypt.hash(password, 12);

  const student = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      is_active: true,
      created_at: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      user_id: user.id,
      action: "UPDATE_STUDENT",
      entity: "User",
      entity_id: id,
      details: `Admin updated student: ${student.email}`,
    },
  });

  return NextResponse.json({ student });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.user.findFirst({
    where: {
      id,
      school_id: user.school_id,
      role: "student",
      deleted_at: null,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      user_id: user.id,
      action: "DELETE_STUDENT",
      entity: "User",
      entity_id: id,
      details: `Admin soft-deleted student: ${existing.email}`,
    },
  });

  return NextResponse.json({ message: "Student deleted" });
}