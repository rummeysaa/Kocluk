// backend/scripts/deleteTestUsers.js
// İlayda Yolkulu (öğretmen) ve Ela Aslan (öğrenci) test hesaplarını
// ilişkili tüm kayıtlarıyla birlikte güvenle siler.
// Rümeysa Kaplan'a hiçbir zarar vermez.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUser(nameSearch, expectedRole) {
  // Kullanıcıyı bul
  const allUsers = await prisma.user.findMany({
    where: { role: expectedRole },
    select: { id: true, name: true, email: true, role: true }
  });

  const user = allUsers.find(u => u.name.toLowerCase().includes(nameSearch.toLowerCase()));

  if (!user) {
    console.log(`⚠️  "${nameSearch}" (${expectedRole}) bulunamadı. Atlanıyor.`);
    return;
  }

  console.log(`\n🔍 Bulundu: ${user.name} (id=${user.id}, role=${user.role}, email=${user.email})`);

  // 1. TeacherStudent bağlantılarını sil (hem öğretmen hem öğrenci tarafı)
  const teacherLinks = await prisma.teacherStudent.deleteMany({
    where: { teacherId: user.id }
  });
  const studentLinks = await prisma.teacherStudent.deleteMany({
    where: { studentId: user.id }
  });
  console.log(`  ✅ Öğretmen bağlantıları silindi: ${teacherLinks.count}`);
  console.log(`  ✅ Öğrenci bağlantıları silindi: ${studentLinks.count}`);

  // 2. Assignment kayıtlarını sil (hem öğretmen hem öğrenci tarafı)
  const teacherAssignments = await prisma.assignment.deleteMany({
    where: { teacherId: user.id }
  });
  const studentAssignments = await prisma.assignment.deleteMany({
    where: { studentId: user.id }
  });
  console.log(`  ✅ Öğretmen görevleri silindi: ${teacherAssignments.count}`);
  console.log(`  ✅ Öğrenci görevleri silindi: ${studentAssignments.count}`);

  // 3. Notification kayıtlarını sil
  const notifications = await prisma.notification.deleteMany({
    where: { userId: user.id }
  });
  console.log(`  ✅ Bildirimler silindi: ${notifications.count}`);

  // 4. PracticeExam kayıtlarını sil
  const exams = await prisma.practiceExam.deleteMany({
    where: { studentId: user.id }
  });
  console.log(`  ✅ Sınav kayıtları silindi: ${exams.count}`);

  // 5. ChatMessage ve ChatSession kayıtlarını sil
  const sessions = await prisma.chatSession.findMany({
    where: { studentId: user.id },
    select: { id: true }
  });
  if (sessions.length > 0) {
    const sessionIds = sessions.map(s => s.id);
    const messages = await prisma.chatMessage.deleteMany({
      where: { sessionId: { in: sessionIds } }
    });
    console.log(`  ✅ Chat mesajları silindi: ${messages.count}`);
    const deletedSessions = await prisma.chatSession.deleteMany({
      where: { studentId: user.id }
    });
    console.log(`  ✅ Chat oturumları silindi: ${deletedSessions.count}`);
  }

  // 6. FocusSession kayıtlarını sil
  const focusSessions = await prisma.focusSession.deleteMany({
    where: { studentId: user.id }
  });
  console.log(`  ✅ Odak oturumları silindi: ${focusSessions.count}`);

  // 7. Kullanıcıyı sil
  await prisma.user.delete({ where: { id: user.id } });
  console.log(`  🗑️  ${user.name} (${user.role}) başarıyla silindi!`);
}

async function main() {
  console.log('=== Test Kullanıcıları Silme İşlemi ===\n');

  // Önce Ela Aslan'ı sil (öğrenci) - assignment foreign key'ler yüzünden önce öğrenci
  await deleteUser('Ela', 'STUDENT');

  // Sonra İlayda Yolkulu'yu sil (öğretmen)
  await deleteUser('İlayda', 'TEACHER');
  // Türkçe karakter sorunu olabilir, alternatif arama
  await deleteUser('layda', 'TEACHER');
  await deleteUser('ilayda', 'TEACHER');

  // Doğrulama: Rümeysa Kaplan hâlâ var mı?
  console.log('\n=== Doğrulama ===');
  const remaining = await prisma.user.findMany({
    select: { id: true, name: true, role: true, email: true }
  });
  console.log(`Kalan kullanıcılar (${remaining.length}):`);
  remaining.forEach(u => console.log(`  id=${u.id} | ${u.name} | ${u.role} | ${u.email}`));
}

main()
  .catch((e) => console.error('Hata:', e))
  .finally(async () => await prisma.$disconnect());
