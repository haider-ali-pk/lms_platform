const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
bcrypt.hash('Password@123', 12).then(h => 
  p.user.updateMany({data:{password_hash:h, last_password_change:null}})
  .then(r => { console.log('Updated:', r.count); p[''](); })
);
