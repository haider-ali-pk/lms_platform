import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@eduflow.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@eduflow.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })

  const school = await prisma.school.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: {
      name: 'Demo School',
      slug: 'demo-school',
      plan: 'PROFESSIONAL',
      isActive: true,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demoschool.com' },
    update: {},
    create: {
      name: 'School Admin',
      email: 'admin@demoschool.com',
      passwordHash,
      role: 'ADMIN',
      schoolId: school.id,
    },
  })

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@demoschool.com' },
    update: {},
    create: {
      name: 'Ahmed Khan',
      email: 'teacher@demoschool.com',
      passwordHash,
      role: 'TEACHER',
      schoolId: school.id,
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@demoschool.com' },
    update: {},
    create: {
      name: 'Ali Hassan',
      email: 'student@demoschool.com',
      passwordHash,
      role: 'STUDENT',
      schoolId: school.id,
    },
  })

  const parent = await prisma.user.upsert({
    where: { email: 'parent@demoschool.com' },
    update: {},
    create: {
      name: 'Hassan Ali',
      email: 'parent@demoschool.com',
      passwordHash,
      role: 'PARENT',
      schoolId: school.id,
    },
  })

  console.log('✅ Seeded successfully')
  console.log('superadmin@eduflow.com / Admin@123')
  console.log('admin@demoschool.com / Admin@123')
  console.log('teacher@demoschool.com / Admin@123')
  console.log('student@demoschool.com / Admin@123')
  console.log('parent@demoschool.com / Admin@123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())