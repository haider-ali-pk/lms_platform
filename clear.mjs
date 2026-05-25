import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const r = await p.enrollment.deleteMany()
console.log('Deleted:', r.count)
await p.$disconnect()