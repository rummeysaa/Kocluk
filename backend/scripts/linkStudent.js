// backend/scripts/linkStudent.js
/*
  This script ensures that the student named "Batuhan" is linked to the teacher
  "Rumeysa Kaplan" (or any teacher with that name). It runs directly against the
  Prisma database, bypassing the HTTP API, so no JWT is required.
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the teacher by name (case‑insensitive)
  const teacher = await prisma.user.findFirst({
    where: {
      role: 'TEACHER',
      name: { contains: 'Rumeysa', mode: 'insensitive' },
    },
    select: { id: true, name: true },
  });

  if (!teacher) {
    console.error('❌ Teacher "Rumeysa Kaplan" not found in the database.');
    process.exit(1);
  }
  console.log(`✅ Found teacher: ${teacher.name} (id=${teacher.id})`);

  // Find the student named Batuhan (case‑insensitive)
  let student = await prisma.user.findFirst({
    where: {
      role: 'STUDENT',
      name: { contains: 'Batuhan', mode: 'insensitive' },
    },
    select: { id: true, name: true, email: true },
  });

  if (!student) {
    // If the student does not exist, create a placeholder record.
    const placeholderEmail = `batuhan_${Date.now()}@example.com`;
    student = await prisma.user.create({
      data: {
        name: 'Batuhan',
        email: placeholderEmail,
        password: 'placeholder', // will be hashed later if needed
        role: 'STUDENT',
      },
      select: { id: true, name: true, email: true },
    });
    console.log(`⚠️ Created placeholder student: ${student.name} (id=${student.id})`);
  } else {
    console.log(`✅ Found student: ${student.name} (id=${student.id})`);
  }

  // Check whether the link already exists
  const existingLink = await prisma.teacherStudent.findUnique({
    where: {
      teacherId_studentId: {
        teacherId: teacher.id,
        studentId: student.id,
      },
    },
  });

  if (existingLink) {
    console.log('🔗 Link already exists – nothing to do.');
  } else {
    // Create the link
    await prisma.teacherStudent.create({
      data: {
        teacherId: teacher.id,
        studentId: student.id,
      },
    });
    console.log('🔗 Successfully created the teacher‑student link!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Unexpected error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
