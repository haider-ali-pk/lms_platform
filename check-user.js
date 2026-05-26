const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.user.findFirst({where:{id:'cmpjbyttx0h0kivlxepo9nr68'}}).then(u => {
  console.log('last_password_change:', u.last_password_change);
  process.exit(0);
});
