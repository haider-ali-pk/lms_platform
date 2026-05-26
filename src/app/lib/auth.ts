import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function getTokenFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  return token || null
}

export async function getUserFromRequest(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return null
    const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, SECRET)
    return payload as any
  } catch {
    return null
  }
}