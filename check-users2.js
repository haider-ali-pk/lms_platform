const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = ['super_admin', 'admin', 'teacher', 'student', 'parent'];
  for (const role of roles) {
    const user = await prisma.user.findFirst({
      where: { role },
      select: { email: true, role: true }
    });
    console.log(role + ':', user?.email);
  }
  await prisma.$disconnect();
}

main();