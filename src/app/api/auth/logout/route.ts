export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out' })
  response.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
  })
  return response
}