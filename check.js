const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.course.findMany({ 
  take: 5, 
  select: { id: true, title: true, school_id: true } 
}).then(courses => {
  console.log('Courses:', JSON.stringify(courses, null, 2));
  return p.user.findFirst({ 
    where: { email: 'admin01@beacon-house-school.edu.pk' }, 
    select: { school_id: true } 
  });
}).then(admin => {
  console.log('Admin school_id:', admin.school_id);
  return p.course.count({ where: { school_id: admin.school_id } });
}).then(count => {
  console.log('Courses with admin school_id:', count);
  p.$disconnect();
});