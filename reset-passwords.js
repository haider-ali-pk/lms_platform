const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password@123', 10);
  const result = await prisma.user.updateMany({
    data: {
      password_hash: hash,
      last_password_change: new Date(),
      login_attempts: 0,
      locked_until: null
    }
  });
  console.log('Updated:', result.count, 'users');
  await prisma.$disconnect();
}

main();