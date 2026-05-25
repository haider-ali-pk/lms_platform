import { PrismaClient, Role, PlanTier, SubscriptionStatus, LessonType, AttendanceStatus, AssignmentStatus, CertificateStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysAgo));
  return d;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─────────────────────────────────────────────
// PAKISTANI NAME DATA
// ─────────────────────────────────────────────

const maleFirstNames = [
  "Ahmed", "Ali", "Usman", "Bilal", "Hassan", "Hamza", "Omar", "Zain", "Faisal", "Tariq",
  "Kamran", "Imran", "Asad", "Khalid", "Saad", "Junaid", "Naveed", "Shahid", "Rizwan", "Adeel",
  "Fahad", "Waleed", "Sohail", "Irfan", "Waqar", "Danish", "Umer", "Talha", "Awais", "Babar",
  "Zubair", "Qasim", "Yasir", "Arslan", "Shehzad", "Farhan", "Kashif", "Naeem", "Haris", "Aqib",
  "Mudassar", "Safdar", "Nasir", "Jahangir", "Salman", "Waseem", "Arif", "Sajid", "Raza", "Tahir",
];

const femaleFirstNames = [
  "Fatima", "Ayesha", "Zara", "Hira", "Sana", "Nadia", "Rabia", "Amna", "Sara", "Maria",
  "Mahnoor", "Iqra", "Layla", "Noor", "Aliya", "Bushra", "Sadia", "Mehwish", "Asma", "Lubna",
  "Farah", "Naila", "Uzma", "Saira", "Rukhsar", "Samia", "Shazia", "Kiran", "Amber", "Saba",
  "Iram", "Fiza", "Nimra", "Hafsa", "Maryam", "Zainab", "Tooba", "Javeria", "Sidra", "Tehreem",
  "Areeba", "Sundus", "Malaika", "Aisha", "Palwasha", "Zoya", "Rimsha", "Mishal", "Dua", "Emaan",
];

const lastNames = [
  "Khan", "Ahmed", "Ali", "Sheikh", "Malik", "Qureshi", "Chaudhry", "Butt", "Akhtar", "Hussain",
  "Siddiqui", "Mirza", "Baig", "Raja", "Rana", "Gill", "Nawaz", "Raza", "Javed", "Rafiq",
  "Hashmi", "Abbasi", "Ansari", "Farooqi", "Lodhi", "Niazi", "Bhatti", "Gondal", "Warraich", "Aslam",
  "Riaz", "Zafar", "Mughal", "Ismail", "Cheema", "Bajwa", "Dogar", "Toor", "Sandhu", "Virk",
];

const schoolNames = [
  "Beacon House School System",
  "The City School",
  "Roots International Schools",
  "Lahore Grammar School",
  "Froebel's International School",
  "Allied School",
  "Happy Home School",
  "Divisional Public School",
  "Punjab Group of Colleges",
  "Army Public School",
];

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English Literature",
  "Urdu", "Pakistan Studies", "Islamiyat", "Computer Science", "Economics",
  "Geography", "History", "Statistics", "Accounting", "General Science",
];

const grades = ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "O-Level", "A-Level"];

const sections = ["A", "B", "C", "D"];

const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala"];

const courseDescriptions = [
  "A comprehensive course covering all fundamental concepts with practical examples and real-world applications.",
  "Designed to build strong conceptual understanding through interactive lessons, quizzes, and assignments.",
  "An in-depth exploration of the subject with step-by-step guidance suitable for all learning levels.",
  "Master the core topics through structured lessons, regular assessments, and detailed feedback.",
  "Build confidence and competence through a carefully sequenced curriculum aligned with national standards.",
];

const lessonTitles: Record<string, string[]> = {
  "Mathematics": ["Number Systems", "Algebra Basics", "Linear Equations", "Quadratic Equations", "Geometry Fundamentals", "Trigonometry", "Calculus Introduction", "Statistics & Probability", "Matrices", "Sets & Functions"],
  "Physics": ["Kinematics", "Newton's Laws", "Work & Energy", "Waves & Sound", "Electrostatics", "Current Electricity", "Magnetism", "Optics", "Modern Physics", "Thermodynamics"],
  "Chemistry": ["Atomic Structure", "Chemical Bonding", "Periodic Table", "Acids & Bases", "Redox Reactions", "Organic Chemistry", "Electrochemistry", "Chemical Equilibrium", "Thermochemistry", "Industrial Chemistry"],
  "Biology": ["Cell Biology", "Genetics", "Evolution", "Ecology", "Human Physiology", "Plant Biology", "Microbiology", "Biotechnology", "Nutrition & Digestion", "Nervous System"],
  "Computer Science": ["Introduction to Programming", "Variables & Data Types", "Control Structures", "Functions", "Arrays & Lists", "Object-Oriented Programming", "Databases", "Networking Basics", "Web Development", "Algorithms"],
  "English Literature": ["Essay Writing", "Grammar & Punctuation", "Poetry Analysis", "Short Stories", "Novel Study", "Creative Writing", "Comprehension Skills", "Report Writing", "Debate & Discussion", "Research Skills"],
};

function getName(gender: "male" | "female"): { first: string; last: string } {
  const first = gender === "male" ? rand(maleFirstNames) : rand(femaleFirstNames);
  const last = rand(lastNames);
  return { first, last };
}

function fakeEmail(first: string, last: string, index: number): string {
  const patterns = [
    `${first.toLowerCase()}.${last.toLowerCase()}${index}@gmail.com`,
    `${first.toLowerCase()}${index}@yahoo.com`,
    `${last.toLowerCase()}.${first.toLowerCase()}${index}@hotmail.com`,
    `${first.toLowerCase()}${last.toLowerCase().slice(0, 3)}${index}@gmail.com`,
  ];
  return rand(patterns);
}

// ─────────────────────────────────────────────
// MAIN SEED
// ─────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting EduFlow seed...");

  const passwordHash = await bcrypt.hash("Password@123", 10);

  // ── REAL USERS ASSIGNMENT ──
  const realEmails = [
    { email: "haiderslick12@gmail.com",        role: "super_admin" as Role },
    { email: "haider.ali.offical07@gmail.com", role: "admin" as Role },
    { email: "ha8076773@gmail.com",            role: "admin" as Role },
    { email: "ha9164256@gmail.com",            role: "teacher" as Role },
    { email: "immahnoorkhan678@gmail.com",     role: "teacher" as Role },
    { email: "i.aliyahaider@gmail.com",        role: "student" as Role },
    { email: "xcentric.haider1@gmail.com",     role: "student" as Role },
    { email: "xcentric.haider@gmail.com",      role: "parent" as Role },
    { email: "i.kakarot.isl@gmail.com",        role: "parent" as Role },
    { email: "imericjohnson678@gmail.com",     role: "student" as Role }, // spare → student
  ];

  // ── SCHOOLS ──
  console.log("🏫 Creating schools...");
  const schools: { id: string; name: string; slug: string; email: string; phone: string | null; address: string | null; city: string | null; logo_url: string | null; primary_color: string | null; custom_domain: string | null; is_active: boolean; created_at: Date; updated_at: Date }[] = [];

  for (let i = 0; i < 10; i++) {
    const name = schoolNames[i];
    const city = cities[i];
    const school = await prisma.school.upsert({
      where: { slug: slug(name) },
      update: {},
      create: {
        name,
        slug: slug(name),
        email: `info@${slug(name)}.edu.pk`,
        phone: `+92-${randInt(300, 345)}-${randInt(1000000, 9999999)}`,
        address: `${randInt(1, 200)} Main Boulevard, ${city}`,
        city,
        is_active: true,
      },
    });
    schools.push(school);

    // Stripe subscription per school
    await prisma.stripeSubscription.upsert({
      where: { school_id: school.id },
      update: {},
      create: {
        school_id: school.id,
        stripe_customer_id: `cus_seed_${school.id}`,
        stripe_subscription_id: `sub_seed_${school.id}`,
        plan: rand([PlanTier.starter, PlanTier.growth, PlanTier.enterprise]),
        status: SubscriptionStatus.active,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ── SUPER ADMIN (real email, no school) ──
  console.log("👑 Creating super admin...");
  await prisma.user.upsert({
    where: { email: "haiderslick12@gmail.com" },
    update: {},
    create: {
      email: "haiderslick12@gmail.com",
      password_hash: passwordHash,
      role: Role.super_admin,
      first_name: "Haider",
      last_name: "Ali",
      is_active: true,
      is_verified: true,
      last_password_change: new Date(),
    },
  });

  // ── ADMINS (2 real, then fake per school) ──
  console.log("🏢 Creating admins...");
  const adminRealEmails = [
    { email: "haider.ali.offical07@gmail.com", first: "Haider", last: "Ali", schoolIdx: 0 },
    { email: "ha8076773@gmail.com",            first: "Hassan", last: "Ahmed", schoolIdx: 1 },
  ];

  for (const a of adminRealEmails) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        password_hash: passwordHash,
        role: Role.admin,
        first_name: a.first,
        last_name: a.last,
        school_id: schools[a.schoolIdx].id,
        is_active: true,
        is_verified: true,
        last_password_change: new Date(),
      },
    });
  }

  // 1 fake admin per remaining school
  for (let i = 2; i < 10; i++) {
    const g = rand(["male", "female"]) as "male" | "female";
    const { first, last } = getName(g);
    const email = fakeEmail(first, last, i + 1000);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password_hash: passwordHash,
        role: Role.admin,
        first_name: first,
        last_name: last,
        school_id: schools[i].id,
        is_active: true,
        is_verified: true,
        last_password_change: new Date(),
      },
    });
  }

  // ── TEACHERS ──
  console.log("👨‍🏫 Creating teachers...");
  const teacherRealEmails = [
    { email: "ha9164256@gmail.com",        first: "Haris",   last: "Qureshi", schoolIdx: 0 },
    { email: "immahnoorkhan678@gmail.com", first: "Mahnoor", last: "Khan",    schoolIdx: 0 },
  ];

  const allTeachers: { id: string; school_id: string }[] = [];

  for (const t of teacherRealEmails) {
    const teacher = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        password_hash: passwordHash,
        role: Role.teacher,
        first_name: t.first,
        last_name: t.last,
        school_id: schools[t.schoolIdx].id,
        is_active: true,
        is_verified: true,
        last_password_change: new Date(),
      },
    });
    allTeachers.push({ id: teacher.id, school_id: schools[t.schoolIdx].id });
  }

  // ~20 fake teachers per school = ~200 total
  for (let s = 0; s < 10; s++) {
    for (let t = 0; t < 20; t++) {
      const g = rand(["male", "female"]) as "male" | "female";
      const { first, last } = getName(g);
      const email = fakeEmail(first, last, s * 100 + t + 2000);
      const teacher = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password_hash: passwordHash,
          role: Role.teacher,
          first_name: first,
          last_name: last,
          school_id: schools[s].id,
          is_active: true,
          is_verified: true,
          last_password_change: new Date(),
        },
      });
      allTeachers.push({ id: teacher.id, school_id: schools[s].id });
    }
  }

  // ── CLASSES ──
  console.log("🏛️ Creating classes...");
  const allClasses: { id: string; school_id: string; grade: string }[] = [];

  for (const school of schools) {
    for (const grade of grades) {
      for (const section of sections) {
        const cls = await prisma.class.upsert({
          where: { id: `cls_${school.id}_${slug(grade)}_${section}` },
          update: {},
          create: {
            id: `cls_${school.id}_${slug(grade)}_${section}`,
            school_id: school.id,
            name: `${grade} - ${section}`,
            grade,
            section,
            academic_year: "2024-2025",
          },
        });
        allClasses.push({ id: cls.id, school_id: school.id, grade });

        // Assign a teacher to this class
        const schoolTeachers = allTeachers.filter(t => t.school_id === school.id);
        if (schoolTeachers.length > 0) {
          const teacher = rand(schoolTeachers);
          await prisma.classTeacher.upsert({
            where: { class_id_teacher_id: { class_id: cls.id, teacher_id: teacher.id } },
            update: {},
            create: { class_id: cls.id, teacher_id: teacher.id },
          });
        }
      }
    }
  }

  // ── COURSES ──
  console.log("📚 Creating courses...");
  const allCourses: { id: string; school_id: string; subject: string }[] = [];

  for (const school of schools) {
    const schoolTeachers = allTeachers.filter(t => t.school_id === school.id);
    for (const subject of subjects) {
      for (const grade of grades.slice(0, 6)) { // 6 grades per school
        const teacher = rand(schoolTeachers.length ? schoolTeachers : allTeachers);
        const courseId = `crs_${school.id}_${slug(subject)}_${slug(grade)}`;
        const course = await prisma.course.upsert({
          where: { id: courseId },
          update: {},
          create: {
            id: courseId,
            school_id: school.id,
            author_id: teacher.id,
            title: `${subject} — ${grade}`,
            description: rand(courseDescriptions),
            subject,
            grade_level: grade,
            is_published: true,
            pass_mark: rand([50, 60, 70]),
          },
        });
        allCourses.push({ id: course.id, school_id: school.id, subject });

        // Lessons
        const titles = lessonTitles[subject] || lessonTitles["Mathematics"];
        for (let l = 0; l < titles.length; l++) {
          await prisma.lesson.upsert({
            where: { id: `les_${courseId}_${l}` },
            update: {},
            create: {
              id: `les_${courseId}_${l}`,
              course_id: course.id,
              title: titles[l],
              content: `This lesson covers ${titles[l]} in detail with examples and practice problems.`,
              type: rand([LessonType.video, LessonType.text, LessonType.pdf]),
              order: l,
              duration_min: randInt(20, 60),
              is_published: true,
            },
          });
        }

        // Quiz
        const quizId = `qz_${courseId}`;
        await prisma.quiz.upsert({
          where: { id: quizId },
          update: {},
          create: {
            id: quizId,
            course_id: course.id,
            title: `${subject} Mid-Term Quiz`,
            description: `Test your understanding of ${subject} concepts.`,
            time_limit: 30,
            pass_mark: 60,
            max_attempts: 3,
            is_published: true,
          },
        });

        // Quiz questions
        for (let q = 0; q < 5; q++) {
          await prisma.quizQuestion.upsert({
            where: { id: `qq_${quizId}_${q}` },
            update: {},
            create: {
              id: `qq_${quizId}_${q}`,
              quiz_id: quizId,
              question_text: `Question ${q + 1}: Which of the following best describes a concept in ${subject}?`,
              options: JSON.stringify(["Option A", "Option B", "Option C", "Option D"]),
              correct_index: randInt(0, 3),
              explanation: `The correct answer relates to the core principles of ${subject}.`,
              points: 2,
              order: q,
            },
          });
        }

        // Assignment
        await prisma.assignment.upsert({
          where: { id: `asgn_${courseId}` },
          update: {},
          create: {
            id: `asgn_${courseId}`,
            course_id: course.id,
            title: `${subject} Assignment 1`,
            description: `Complete the following exercises based on what you have learned in ${subject}.`,
            due_date: new Date(Date.now() + randInt(3, 14) * 24 * 60 * 60 * 1000),
            max_marks: 100,
            is_published: true,
          },
        });
      }
    }
  }

  // ── STUDENTS ──
  console.log("🎓 Creating students (~1000 per school = ~10,000 total)...");
  const allStudents: { id: string; school_id: string }[] = [];

  // Real student emails
  const studentRealEmails = [
    { email: "i.aliyahaider@gmail.com",    first: "Aliya",  last: "Haider", schoolIdx: 0 },
    { email: "xcentric.haider1@gmail.com", first: "Haider", last: "Malik",  schoolIdx: 0 },
    { email: "imericjohnson678@gmail.com", first: "Eric",   last: "Johnson",schoolIdx: 1 },
  ];

  for (const s of studentRealEmails) {
    const student = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        password_hash: passwordHash,
        role: Role.student,
        first_name: s.first,
        last_name: s.last,
        school_id: schools[s.schoolIdx].id,
        is_active: true,
        is_verified: true,
        last_password_change: new Date(),
      },
    });
    allStudents.push({ id: student.id, school_id: schools[s.schoolIdx].id });
  }

  // Fake students — 1000 per school
  for (let s = 0; s < 10; s++) {
    console.log(`  School ${s + 1}/10 students...`);
    for (let i = 0; i < 1000; i++) {
      const g = rand(["male", "female"]) as "male" | "female";
      const { first, last } = getName(g);
      const email = fakeEmail(first, last, s * 1000 + i + 5000);
      const student = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password_hash: passwordHash,
          role: Role.student,
          first_name: first,
          last_name: last,
          school_id: schools[s].id,
          is_active: true,
          is_verified: true,
          last_password_change: new Date(),
        },
      });
      allStudents.push({ id: student.id, school_id: schools[s].id });
    }
  }

  // ── PARENTS ──
  console.log("👪 Creating parents (~1000 per school = ~10,000 total)...");
  const allParents: { id: string; school_id: string }[] = [];

  const parentRealEmails = [
    { email: "xcentric.haider@gmail.com", first: "Haider",  last: "Ahmed", schoolIdx: 0 },
    { email: "i.kakarot.isl@gmail.com",   first: "Kakarot", last: "Isl",   schoolIdx: 0 },
  ];

  for (const p of parentRealEmails) {
    const parent = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        password_hash: passwordHash,
        role: Role.parent,
        first_name: p.first,
        last_name: p.last,
        school_id: schools[p.schoolIdx].id,
        is_active: true,
        is_verified: true,
        last_password_change: new Date(),
      },
    });
    allParents.push({ id: parent.id, school_id: schools[p.schoolIdx].id });
  }

  for (let s = 0; s < 10; s++) {
    console.log(`  School ${s + 1}/10 parents...`);
    for (let i = 0; i < 1000; i++) {
      const g = rand(["male", "female"]) as "male" | "female";
      const { first, last } = getName(g);
      const email = fakeEmail(first, last, s * 1000 + i + 15000);
      const parent = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password_hash: passwordHash,
          role: Role.parent,
          first_name: first,
          last_name: last,
          school_id: schools[s].id,
          is_active: true,
          is_verified: true,
          last_password_change: new Date(),
        },
      });
      allParents.push({ id: parent.id, school_id: schools[s].id });
    }
  }

  // ── PARENT-STUDENT LINKS ──
  console.log("🔗 Linking parents to students...");
  for (let s = 0; s < 10; s++) {
    const schoolStudents = allStudents.filter(st => st.school_id === schools[s].id);
    const schoolParents = allParents.filter(p => p.school_id === schools[s].id);
    const limit = Math.min(schoolStudents.length, schoolParents.length);
    for (let i = 0; i < limit; i++) {
      await prisma.parentStudent.upsert({
        where: {
          parent_id_student_id: {
            parent_id: schoolParents[i].id,
            student_id: schoolStudents[i].id,
          },
        },
        update: {},
        create: {
          parent_id: schoolParents[i].id,
          student_id: schoolStudents[i].id,
        },
      });
    }
  }

  // ── ENROLLMENTS ──
  console.log("📋 Creating enrollments...");
  for (let s = 0; s < 10; s++) {
    const schoolStudents = allStudents.filter(st => st.school_id === schools[s].id);
    const schoolCourses = allCourses.filter(c => c.school_id === schools[s].id);
    // Each student enrolled in 3-5 courses
    for (const student of schoolStudents) {
      const count = randInt(3, 5);
      const picked = schoolCourses.sort(() => Math.random() - 0.5).slice(0, count);
      for (const course of picked) {
        await prisma.enrollment.upsert({
          where: {
            student_id_course_id: {
              student_id: student.id,
              course_id: course.id,
            },
          },
          update: {},
          create: {
            student_id: student.id,
            course_id: course.id,
            enrolled_at: randDate(180),
          },
        });
      }
    }
  }

  // ── ATTENDANCE (last 30 days per class) ──
  console.log("📅 Creating attendance records...");
  for (let s = 0; s < 3; s++) { // first 3 schools only to keep seed fast
    const schoolClasses = allClasses.filter(c => c.school_id === schools[s].id);
    const schoolStudents = allStudents.filter(st => st.school_id === schools[s].id);
    for (const cls of schoolClasses.slice(0, 4)) {
      const classStudents = schoolStudents.slice(0, 30);
      for (const student of classStudents) {
        for (let d = 0; d < 10; d++) {
          const date = new Date();
          date.setDate(date.getDate() - d);
          date.setHours(0, 0, 0, 0);
          await prisma.attendance.upsert({
            where: {
              class_id_student_id_date: {
                class_id: cls.id,
                student_id: student.id,
                date,
              },
            },
            update: {},
            create: {
              class_id: cls.id,
              student_id: student.id,
              date,
              status: rand([AttendanceStatus.present, AttendanceStatus.present, AttendanceStatus.present, AttendanceStatus.absent, AttendanceStatus.late]),
            },
          });
        }
      }
    }
  }

  // ── QUIZ ATTEMPTS ──
  console.log("📝 Creating quiz attempts...");
  for (let s = 0; s < 3; s++) {
    const schoolStudents = allStudents.filter(st => st.school_id === schools[s].id).slice(0, 100);
    const schoolCourses = allCourses.filter(c => c.school_id === schools[s].id);
    for (const student of schoolStudents) {
      for (const course of schoolCourses.slice(0, 2)) {
        const quiz = await prisma.quiz.findFirst({ where: { course_id: course.id } });
        if (!quiz) continue;
        const score = randInt(30, 100);
        await prisma.quizAttempt.create({
          data: {
            quiz_id: quiz.id,
            student_id: student.id,
            answers: JSON.stringify([0, 1, 2, 0, 1]),
            score,
            passed: score >= 60,
            time_taken: randInt(600, 1800),
            submitted_at: randDate(60),
          },
        });
      }
    }
  }

  // ── ASSIGNMENT SUBMISSIONS ──
  console.log("📄 Creating assignment submissions...");
  for (let s = 0; s < 3; s++) {
    const schoolStudents = allStudents.filter(st => st.school_id === schools[s].id).slice(0, 100);
    const schoolCourses = allCourses.filter(c => c.school_id === schools[s].id);
    for (const student of schoolStudents) {
      for (const course of schoolCourses.slice(0, 2)) {
        const assignment = await prisma.assignment.findFirst({ where: { course_id: course.id } });
        if (!assignment) continue;
        const marks = randInt(40, 100);
        await prisma.assignmentSubmission.upsert({
          where: {
            assignment_id_student_id: {
              assignment_id: assignment.id,
              student_id: student.id,
            },
          },
          update: {},
          create: {
            assignment_id: assignment.id,
            student_id: student.id,
            text_answer: `This is my answer to the assignment. I have studied the topic thoroughly and applied the concepts learned in class.`,
            status: rand([AssignmentStatus.submitted, AssignmentStatus.graded]),
            marks,
            feedback: marks >= 70 ? "Excellent work! Well done." : "Good effort. Review the core concepts.",
            submitted_at: randDate(30),
            graded_at: randDate(20),
          },
        });
      }
    }
  }

  // ── CERTIFICATES ──
  console.log("🏆 Creating certificates...");
  for (let s = 0; s < 3; s++) {
    const schoolStudents = allStudents.filter(st => st.school_id === schools[s].id).slice(0, 50);
    const schoolCourses = allCourses.filter(c => c.school_id === schools[s].id);
    for (const student of schoolStudents) {
      const course = rand(schoolCourses);
      await prisma.certificate.upsert({
        where: {
          student_id_course_id: {
            student_id: student.id,
            course_id: course.id,
          },
        },
        update: {},
        create: {
          student_id: student.id,
          course_id: course.id,
          grade: rand(["A+", "A", "B+", "B", "C"]),
          status: CertificateStatus.issued,
          score: randInt(70, 100),
          issued_at: randDate(90),
        },
      });
    }
  }

  // ── BADGES ──
  console.log("🎖️ Creating badges...");
  const badgeData = [
    { name: "First Lesson",     description: "Completed your very first lesson",          icon: "BookOpen",   color: "#4F46E5", trigger_type: "first_lesson"     },
    { name: "Quick Learner",    description: "Completed 5 lessons in a single day",        icon: "Zap",        color: "#F59E0B", trigger_type: "quick_learner"    },
    { name: "Perfect Score",    description: "Scored 100% on a quiz",                      icon: "Star",       color: "#10B981", trigger_type: "perfect_score"    },
    { name: "Course Champion",  description: "Completed an entire course",                 icon: "Trophy",     color: "#6366F1", trigger_type: "course_champion"  },
    { name: "Streak Master",    description: "Maintained a 7-day learning streak",         icon: "Flame",      color: "#EF4444", trigger_type: "streak_master"    },
    { name: "Assignment Ace",   description: "Submitted all assignments on time for a month", icon: "CheckCircle", color: "#059669", trigger_type: "assignment_ace" },
    { name: "Social Star",      description: "Received 10 upvotes on discussion posts",    icon: "ThumbsUp",   color: "#8B5CF6", trigger_type: "social_star"      },
    { name: "Early Bird",       description: "Logged in before 8am for 5 consecutive days",icon: "Sunrise",    color: "#F97316", trigger_type: "early_bird"       },
    { name: "Night Owl",        description: "Completed a lesson after 10pm",              icon: "Moon",       color: "#1E40AF", trigger_type: "night_owl"        },
    { name: "Top of Class",     description: "Highest quiz average in a course",           icon: "Award",      color: "#DC2626", trigger_type: "top_of_class"     },
  ];

  for (const b of badgeData) {
    await prisma.badge.upsert({
      where: { trigger_type: b.trigger_type as any },
      update: {},
      create: b as any,
    });
  }

  // ── LEARNING STREAKS for real students ──
  console.log("🔥 Creating learning streaks...");
  const realStudents = allStudents.slice(0, 3);
  for (const student of realStudents) {
    await prisma.learningStreak.upsert({
      where: { student_id: student.id },
      update: {},
      create: {
        student_id: student.id,
        current_streak: randInt(1, 15),
        longest_streak: randInt(15, 45),
        last_activity_date: new Date(),
      },
    });
  }

  // ── NOTIFICATIONS ──
  console.log("🔔 Creating sample notifications...");
  const realStudentUser = allStudents[0];
  if (realStudentUser) {
    await prisma.notification.create({
      data: {
        user_id: realStudentUser.id,
        type: "assignment_due",
        title: "Assignment Due Tomorrow",
        body: "Your Mathematics Assignment 1 is due tomorrow. Submit before the deadline.",
        is_read: false,
      },
    });
    await prisma.notification.create({
      data: {
        user_id: realStudentUser.id,
        type: "quiz_result",
        title: "Quiz Result Available",
        body: "Your Physics Mid-Term Quiz has been graded. You scored 85%.",
        is_read: false,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log("🔑 All users password: Password@123");
  console.log("👑 Super Admin: haiderslick12@gmail.com");
  console.log("🏢 Admin 1:     haider.ali.offical07@gmail.com");
  console.log("🏢 Admin 2:     ha8076773@gmail.com");
  console.log("👨‍🏫 Teacher 1:   ha9164256@gmail.com");
  console.log("👨‍🏫 Teacher 2:   immahnoorkhan678@gmail.com");
  console.log("🎓 Student 1:   i.aliyahaider@gmail.com");
  console.log("🎓 Student 2:   xcentric.haider1@gmail.com");
  console.log("🎓 Student 3:   imericjohnson678@gmail.com");
  console.log("👪 Parent 1:    xcentric.haider@gmail.com");
  console.log("👪 Parent 2:    i.kakarot.isl@gmail.com");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });