import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: object) {
  const JWT_SECRET = process.env.JWT_SECRET!
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  const JWT_SECRET = process.env.JWT_SECRET!
  return jwt.verify(token, JWT_SECRET) as any
}

export function getTokenFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return req.cookies.get('token')?.value || null
}

export async function getUserFromRequest(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return null
    // Try jose first (httpOnly cookie tokens signed with SignJWT)
    try {
      const { payload } = await jwtVerify(token, SECRET)
      return payload as any
    } catch {
      // Fall back to jsonwebtoken (old localStorage tokens)
      return verifyToken(token)
    }
  } catch {
    return null
  }
}