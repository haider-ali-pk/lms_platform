import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

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
  const token = req.cookies.get('token')?.value
  return token || null
}

export function getUserFromRequest(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}