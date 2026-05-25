import nodemailer from "nodemailer";
import { prisma } from "@/app/lib/prisma";

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendOTP(userId: string, email: string): Promise<void> {
  // Invalidate old OTPs
  await prisma.otp.updateMany({
    where: { user_id: userId, used: false },
    data: { used: true },
  });

  const code = generateOTP();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otp.create({
    data: { user_id: userId, code, expires_at, used: false },
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"EduFlow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your EduFlow Verification Code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#4F46E5;font-size:28px;margin:0;">EduFlow</h1>
        </div>
        <div style="background:#fff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
          <h2 style="color:#111827;font-size:20px;margin-top:0;">Verification Code</h2>
          <p style="color:#6b7280;">Enter this code to continue. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center;margin:32px 0;">
            <span style="font-size:48px;font-weight:700;letter-spacing:12px;color:#4F46E5;">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:13px;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  });
}

export async function verifyOTP(userId: string, code: string): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: {
      user_id: userId,
      code,
      used: false,
      expires_at: { gt: new Date() },
    },
  });

  if (!otp) return false;

  await prisma.otp.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return true;
}

export async function checkResendLimit(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.otp.count({
    where: {
      user_id: userId,
      created_at: { gt: oneHourAgo },
    },
  });
  return count < 3;
}