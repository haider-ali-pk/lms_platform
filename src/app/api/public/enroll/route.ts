export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { school_id, student_name, parent_name, phone, grade, date_of_birth } = body;

    if (!school_id || !student_name || !parent_name || !phone || !grade || !date_of_birth) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Validate school exists
    const school = await prisma.school.findUnique({
      where: { id: school_id, is_active: true },
    });
    if (!school) {
      return NextResponse.json({ error: "Invalid school" }, { status: 400 });
    }

    const request = await prisma.enrollmentRequest.create({
      data: {
        school_id,
        student_name: student_name.trim(),
        parent_name: parent_name.trim(),
        phone: phone.trim(),
        grade: grade.trim(),
        date_of_birth: new Date(date_of_birth),
      },
    });

    return NextResponse.json({ success: true, id: request.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}