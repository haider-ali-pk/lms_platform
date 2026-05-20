import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const SCHOOL_DATA = [
  { name: 'Beacon House School',   city: 'Lahore',     plan: 'enterprise' as const },
  { name: 'Roots International',   city: 'Islamabad',  plan: 'growth'     as const },
  { name: 'The City School',       city: 'Karachi',    plan: 'growth'     as const },
  { name: 'Educators Academy',     city: 'Lahore',     plan: 'starter'    as const },
  { name: 'Punjab College',        city: 'Faisalabad', plan: 'starter'    as const },
  { name: 'DHA College',           city: 'Lahore',     plan: 'enterprise' as const },
  { name: 'Lahore Grammar School', city: 'Lahore',     plan: 'growth'     as const },
  { name: 'Karachi Grammar',       city: 'Karachi',    plan: 'growth'     as const },
  { name: 'Aga Khan School',       city: 'Karachi',    plan: 'enterprise' as const },
  { name: 'Allied School',         city: 'Multan',     plan: 'starter'    as const },
]

const FIRST_NAMES = [
  'Ali','Ahmed','Usman','Hassan','Ibrahim','Bilal','Zain','Omar','Hamza','Tariq',
  'Ayesha','Fatima','Zara','Hina','Sana','Noor','Maryam','Sara','Amna','Rabia',
  'Imran','Shahid','Kamran','Faisal','Asad','Waqar','Aamir','Saad','Talha','Waseem',
]
const LAST_NAMES = [
  'Khan','Ahmed','Ali','Hassan','Sheikh','Malik','Qureshi','Chaudhry','Butt','Rizvi',
  'Akhtar','Baig','Mirza','Siddiqui','Ansari','Javed','Iqbal','Raza','Shah','Hussain',
]
const SUBJECTS = [
  'Mathematics','Physics','Chemistry','Biology','English',
  'Urdu','Computer Science','Islamiat','Pakistan Studies','History',
]
const GRADES = ['Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']

async function main() {
  console.log('🌱 Seeding EduFlow LMS...')

  const superPass   = await bcrypt.hash('SuperAdmin@123', 12)
  const adminPass   = await bcrypt.hash('Admin@123456',   12)
  const teacherPass = await bcrypt.hash('Teacher@123',    12)
  const studentPass = await bcrypt.hash('Student@123',    12)
  const parentPass  = await bcrypt.hash('Parent@123',     12)

  // ── 1. Super Admin ──────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where:  { email: 'superadmin@eduflow.pk' },
    update: {},
    create: {
      email:         'superadmin@eduflow.pk',
      password_hash: superPass,
      role:          'super_admin',
      first_name:    'Haider',
      last_name:     'Ali',
      is_active:     true,
      is_verified:   true,
    },
  })
  console.log('✅ Super Admin:', superAdmin.email)

  // ── 2. Schools + Admins + Subscriptions ────────────────
  const schools: any[] = []

  for (let i = 0; i < SCHOOL_DATA.length; i++) {
    const sd  = SCHOOL_DATA[i]
    const num = String(i + 1).padStart(2, '0')

    const school = await prisma.school.upsert({
      where:  { slug: slugify(sd.name) },
      update: {},
      create: {
        name:      sd.name,
        slug:      slugify(sd.name),
        email:     `info@${slugify(sd.name)}.edu.pk`,
        phone:     `+92-${rand(300,349)}-${rand(1000000,9999999)}`,
        city:      sd.city,
        address:   `${rand(1,200)} Main Boulevard, ${sd.city}`,
        is_active: true,
      },
    })
    schools.push({ ...school, plan: sd.plan, index: i })

    try {
      await prisma.stripeSubscription.upsert({
        where:  { school_id: school.id },
        update: {},
        create: {
          school_id:              school.id,
          stripe_customer_id:     `cus_seed_${i}`,
          stripe_subscription_id: `sub_seed_${i}`,
          plan:                   sd.plan,
          status:                 i === 4 ? 'past_due' : 'active',
          current_period_start:   daysAgo(15),
          current_period_end:     new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      })
    } catch {}

    const adminEmail = `admin${num}@${slugify(sd.name)}.edu.pk`
    await prisma.user.upsert({
      where:  { email: adminEmail },
      update: {},
      create: {
        school_id:     school.id,
        email:         adminEmail,
        password_hash: adminPass,
        role:          'admin',
        first_name:    pick(FIRST_NAMES),
        last_name:     pick(LAST_NAMES),
        is_active:     true,
        is_verified:   true,
      },
    })
    console.log(`✅ School ${i + 1}/10: ${school.name}`)
  }

  // ── 3. Teachers (1,000) ────────────────────────────────
  console.log('👩‍🏫 Seeding 1,000 teachers...')
  const teachers: any[] = []

  for (let s = 0; s < schools.length; s++) {
    for (let t = 0; t < 100; t++) {
      const idx   = s * 100 + t + 1
      const email = `teacher${idx}@${slugify(schools[s].name)}.edu.pk`
      const teacher = await prisma.user.upsert({
        where:  { email },
        update: {},
        create: {
          school_id:     schools[s].id,
          email,
          password_hash: teacherPass,
          role:          'teacher',
          first_name:    pick(FIRST_NAMES),
          last_name:     pick(LAST_NAMES),
          is_active:     true,
          is_verified:   true,
        },
      })
      teachers.push({ ...teacher, school_index: s })
    }
    console.log(`  Teachers school ${s + 1}/10 done`)
  }

  // ── 4. Students (10,000) ───────────────────────────────
  console.log('🎓 Seeding 10,000 students...')
  const students: any[] = []

  for (let s = 0; s < schools.length; s++) {
    for (let st = 0; st < 1000; st++) {
      const idx   = s * 1000 + st + 1
      const email = `student${idx}@${slugify(schools[s].name)}.edu.pk`
      const student = await prisma.user.upsert({
        where:  { email },
        update: {},
        create: {
          school_id:     schools[s].id,
          email,
          password_hash: studentPass,
          role:          'student',
          first_name:    pick(FIRST_NAMES),
          last_name:     pick(LAST_NAMES),
          is_active:     true,
          is_verified:   true,
        },
      })
      students.push({ ...student, school_index: s })
    }
    console.log(`  Students school ${s + 1}/10 done`)
  }

  // ── 5. Parents (10,000) ────────────────────────────────
  console.log('👨‍👩‍👧 Seeding 10,000 parents...')

  for (let s = 0; s < schools.length; s++) {
    const schoolStudents = students.filter(st => st.school_index === s)

    for (let p = 0; p < 1000; p++) {
      const idx   = s * 1000 + p + 1
      const email = `parent${idx}@gmail.com`

      const parent = await prisma.user.upsert({
        where:  { email },
        update: {},
        create: {
          school_id:     schools[s].id,
          email,
          password_hash: parentPass,
          role:          'parent',
          first_name:    pick(FIRST_NAMES),
          last_name:     pick(LAST_NAMES),
          is_active:     true,
          is_verified:   true,
        },
      })

      const myStudent = schoolStudents[p % schoolStudents.length]
      if (myStudent) {
        try {
          await prisma.parentStudent.upsert({
            where: {
              parent_id_student_id: {
                parent_id:  parent.id,
                student_id: myStudent.id,
              },
            },
            update: {},
            create: {
              parent_id:  parent.id,
              student_id: myStudent.id,
            },
          })
        } catch {}
      }
    }
    console.log(`  Parents school ${s + 1}/10 done`)
  }

  // ── 6. Courses + Lessons + Quizzes + Assignments ───────
  console.log('📚 Seeding courses...')

  for (let s = 0; s < schools.length; s++) {
    const schoolTeachers = teachers.filter(t => t.school_index === s)
    const schoolStudents = students.filter(st => st.school_index === s).slice(0, 50)

    for (let c = 0; c < 5; c++) {
      const subject = SUBJECTS[c % SUBJECTS.length]
      const grade   = GRADES[c % GRADES.length]
      const teacher = schoolTeachers[c % schoolTeachers.length]

      const course = await prisma.course.create({
        data: {
          school_id:    schools[s].id,
          author_id:    teacher.id,
          title:        `${subject} — ${grade}`,
          description:  `Complete ${subject} curriculum for ${grade}.`,
          subject,
          grade_level:  grade,
          is_published: true,
          pass_mark:    60,
        },
      })

      for (let l = 0; l < 5; l++) {
        await prisma.lesson.create({
          data: {
            course_id:    course.id,
            title:        `Chapter ${l + 1}: ${subject} Basics`,
            content:      `Notes for chapter ${l + 1}.`,
            type:         l % 2 === 0 ? 'video' : 'text',
            order:        l,
            duration_min: rand(20, 60),
            is_published: true,
          },
        })
      }

      const quiz = await prisma.quiz.create({
        data: {
          course_id:    course.id,
          title:        `${subject} Mid-Term Quiz`,
          time_limit:   30,
          pass_mark:    60,
          max_attempts: 3,
          is_published: true,
        },
      })

      for (let q = 0; q < 5; q++) {
        await prisma.quizQuestion.create({
          data: {
            quiz_id:       quiz.id,
            question_text: `Q${q + 1}: Key concept in ${subject} chapter ${q + 1}?`,
            options:       ['Correct Answer', 'Option B', 'Option C', 'Option D'],
            correct_index: 0,
            points:        2,
            order:         q,
          },
        })
      }

      await prisma.assignment.create({
        data: {
          course_id:    course.id,
          title:        `${subject} Weekly Assignment`,
          description:  `Complete exercises for ${subject}.`,
          due_date:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          max_marks:    100,
          is_published: true,
        },
      })

      for (const student of schoolStudents) {
        try {
          await prisma.enrollment.upsert({
            where: {
              student_id_course_id: {
                student_id: student.id,
                course_id:  course.id,
              },
            },
            update: {},
            create: { student_id: student.id, course_id: course.id },
          })
        } catch {}
      }
    }
    console.log(`  Courses school ${s + 1}/10 done`)
  }

  // ── 7. Classes + Attendance ────────────────────────────
  console.log('🏫 Seeding classes + attendance...')

  for (let s = 0; s < schools.length; s++) {
    const schoolStudents = students.filter(st => st.school_index === s).slice(0, 30)
    const schoolTeachers = teachers.filter(t => t.school_index === s)

    const cls = await prisma.class.create({
      data: {
        school_id:     schools[s].id,
        name:          'Grade 9 — Section A',
        grade:         'Grade 9',
        section:       'A',
        academic_year: '2025-2026',
      },
    })

    if (schoolTeachers[0]) {
      try {
        await prisma.classTeacher.create({
          data: { class_id: cls.id, teacher_id: schoolTeachers[0].id },
        })
      } catch {}
    }

    const statuses = ['present', 'present', 'present', 'absent', 'late'] as const
    for (let d = 0; d < 7; d++) {
      const date = daysAgo(d)
      date.setHours(0, 0, 0, 0)
      for (const student of schoolStudents) {
        try {
          await prisma.attendance.create({
            data: {
              class_id:   cls.id,
              student_id: student.id,
              date,
              status:     pick(statuses),
            },
          })
        } catch {}
      }
    }
  }
  console.log('✅ Classes + attendance done')

  // ── 8. Notifications ───────────────────────────────────
  for (let i = 0; i < 5; i++) {
    await prisma.notification.create({
      data: {
        user_id:   students[i].id,
        school_id: schools[students[i].school_index].id,
        type:      'assignment_due',
        title:     'Assignment Due Tomorrow',
        body:      'Your Mathematics assignment is due tomorrow.',
        is_read:   false,
      },
    })
  }

  // ── 9. AI Chat samples ─────────────────────────────────
  const chatPairs = [
    { role: 'user',      content: "Explain Newton's second law" },
    { role: 'assistant', content: 'F=ma — Force equals mass times acceleration.' },
  ]
  for (let i = 0; i < 10; i++) {
    for (const msg of chatPairs) {
      await prisma.aiChatHistory.create({
        data: {
          student_id: students[i].id,
          role:       msg.role,
          content:    msg.content,
        },
      })
    }
  }

  // ── 10. Audit Logs ─────────────────────────────────────
  for (const action of ['user.login','course.create','quiz.attempt','stripe.webhook']) {
    await prisma.auditLog.create({
      data: {
        user_id:   superAdmin.id,
        school_id: schools[0].id,
        action,
        ip:        '127.0.0.1',
        meta:      { seed: true },
      },
    })
  }

  // ── Summary ────────────────────────────────────────────
  console.log('\n🎉 SEED COMPLETE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('superadmin@eduflow.pk               → SuperAdmin@123')
  console.log('admin01@beacon-house-school.edu.pk  → Admin@123456')
  console.log('teacher1@beacon-house-school.edu.pk → Teacher@123')
  console.log('student1@beacon-house-school.edu.pk → Student@123')
  console.log('parent1@gmail.com                   → Parent@123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('10 schools · 10 admins · 1,000 teachers')
  console.log('10,000 students · 10,000 parents = 21,011 total')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())