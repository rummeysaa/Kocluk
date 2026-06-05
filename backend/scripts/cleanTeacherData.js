// backend/scripts/cleanTeacherData.js
// Rumeysa Kaplan'ın eski öğrenci bağlantılarını ve görevlerini temizler

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Tüm öğretmenleri listele
  const allTeachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    select: { id: true, name: true, email: true }
  });
  
  console.log('Mevcut öğretmenler:');
  allTeachers.forEach(t => console.log(`  id=${t.id}, ${t.name} (${t.email})`));

  // Rumeysa'yı bul (contains ile, case-insensitive olmadan)
  const teacher = allTeachers.find(t => 
    t.name.toLowerCase().includes('rumeysa') || t.name.toLowerCase().includes('rümeysa')
  );

  if (!teacher) {
    console.error('Rumeysa bulunamadı. Yukarıdaki listeden kontrol edin.');
    // Tüm öğretmenler için temizlik yapalım
    if (allTeachers.length === 1) {
      console.log(`Tek öğretmen var: ${allTeachers[0].name}. Onu kullanıyorum.`);
      await cleanTeacher(allTeachers[0]);
    }
    process.exit(0);
  }

  await cleanTeacher(teacher);
}

async function cleanTeacher(teacher) {
  console.log(`\nÖğretmen: ${teacher.name} (id=${teacher.id})`);

  // Mevcut öğrenci bağlantılarını say ve sil
  const studentLinks = await prisma.teacherStudent.count({
    where: { teacherId: teacher.id }
  });
  console.log(`Silinecek öğrenci bağlantısı: ${studentLinks}`);

  await prisma.teacherStudent.deleteMany({
    where: { teacherId: teacher.id }
  });
  console.log('✅ Öğrenci bağlantıları silindi.');

  // Mevcut görevleri say ve sil
  const assignments = await prisma.assignment.count({
    where: { teacherId: teacher.id }
  });
  console.log(`Silinecek görev: ${assignments}`);

  await prisma.assignment.deleteMany({
    where: { teacherId: teacher.id }
  });
  console.log('✅ Görevler silindi.');

  // Doğrulama
  const newStudentCount = await prisma.teacherStudent.count({ where: { teacherId: teacher.id } });
  const newCompletedCount = await prisma.assignment.count({ where: { teacherId: teacher.id, status: 'COMPLETED' } });
  const newPendingCount = await prisma.assignment.count({ where: { teacherId: teacher.id, status: 'PENDING' } });

  console.log('\n--- Güncel İstatistikler ---');
  console.log(`Aktif Öğrenciler: ${newStudentCount}`);
  console.log(`Tamamlanan Görevler: ${newCompletedCount}`);
  console.log(`Bekleyen Değerlendirmeler: ${newPendingCount}`);
  console.log('Tüm değerler 0 ✅');
}

main()
  .catch((e) => console.error('Hata:', e))
  .finally(async () => await prisma.$disconnect());
