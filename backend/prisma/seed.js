const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  await prisma.practiceExam.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash('12345', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@egitimkocu.com', password: hashedPassword, name: 'Sistem Yöneticisi', role: 'ADMIN' },
  });

  const teacherCan = await prisma.user.create({
    data: { email: 'can.yilmaz@egitimkocu.com', password: hashedPassword, name: 'Can Yılmaz', role: 'TEACHER' },
  });

  const teacherZeynep = await prisma.user.create({
    data: { email: 'zeynep.kaya@egitimkocu.com', password: hashedPassword, name: 'Zeynep Kaya', role: 'TEACHER' },
  });

  const studentData = [
    { name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@gmail.com', dept: 'SAY' },
    { name: 'Ayşe Kaya', email: 'ayse.kaya@gmail.com', dept: 'SAY' },
    { name: 'Mehmet Demir', email: 'mehmet.demir@gmail.com', dept: 'SAY' },
    { name: 'Fatma Çelik', email: 'fatma.celik@gmail.com', dept: 'SAY' },
    { name: 'Mustafa Şahin', email: 'mustafa.sahin@gmail.com', dept: 'SAY' },

    { name: 'Zeynep Yıldız', email: 'zeynep.yildiz@gmail.com', dept: 'EA' },
    { name: 'Ali Öztürk', email: 'ali.ozturk@gmail.com', dept: 'EA' },
    { name: 'Elif Aydın', email: 'elif.aydin@gmail.com', dept: 'EA' },
    { name: 'Hüseyin Özdemir', email: 'huseyin.ozdemir@gmail.com', dept: 'EA' },
    { name: 'Esra Arslan', email: 'esra.arslan@gmail.com', dept: 'EA' },

    { name: 'Hasan Doğan', email: 'hasan.dogan@gmail.com', dept: 'DİL' },
    { name: 'Merve Kılıç', email: 'merve.kilic@gmail.com', dept: 'DİL' },
    { name: 'İbrahim Aslan', email: 'ibrahim.aslan@gmail.com', dept: 'DİL' },
    { name: 'Hatice Çetin', email: 'hatice.cetin@gmail.com', dept: 'DİL' },
    { name: 'Emre Bozkurt', email: 'emre.bozkurt@gmail.com', dept: 'DİL' },

    { name: 'Büşra Koç', email: 'busra.koc@gmail.com', dept: 'SÖZ' },
    { name: 'Yusuf Aktaş', email: 'yusuf.aktas@gmail.com', dept: 'SÖZ' },
    { name: 'Meryem Tekin', email: 'meryem.tekin@gmail.com', dept: 'SÖZ' },
    { name: 'Murat Bulut', email: 'murat.bulut@gmail.com', dept: 'SÖZ' },
    { name: 'Gül Erdoğan', email: 'gul.erdogan@gmail.com', dept: 'SÖZ' }
  ];

  const createdStudents = [];
  for (const sd of studentData) {
    const student = await prisma.user.create({
      data: {
        email: sd.email,
        password: hashedPassword,
        name: sd.name,
        role: 'STUDENT',
        department: sd.dept
      }
    });
    createdStudents.push(student);
  }

  // Create assignments and exams for each student so dashboard is not empty
  for (const student of createdStudents) {
    const teacher = Math.random() > 0.5 ? teacherCan : teacherZeynep;
    
    // Assignment 1 (COMPLETED)
    await prisma.assignment.create({
      data: { 
        title: `${student.department} Konu Tekrarı`, 
        content: `${student.department} alanındaki eksik konuları tekrar et.`, 
        status: 'COMPLETED', 
        dueDate: new Date(), 
        teacherId: teacher.id, 
        studentId: student.id,
        studentNote: 'Sorunsuz tamamlandı.',
      }
    });

    // Assignment 2 (PENDING)
    await prisma.assignment.create({
      data: { 
        title: 'Haftalık Deneme Çözümü', 
        content: 'Bu haftaki Türkiye geneli denemesini çöz ve netlerini sisteme gir.', 
        status: 'PENDING', 
        dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), 
        teacherId: teacher.id, 
        studentId: student.id 
      }
    });

    // Practice Exam
    const hundredDaysAgo = new Date();
    hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);
    
    await prisma.practiceExam.create({
      data: { 
        examName: 'Eylül TYT Denemesi', 
        examType: 'TYT', 
        totalNet: Math.floor(Math.random() * 50) + 40, 
        tytTurkish: 25, 
        tytMath: 15, 
        tytSocial: 10, 
        tytScience: 5, 
        studentId: student.id,
        createdAt: hundredDaysAgo
      },
    });
  }

  // Mehmet Demir için 10 adet kronolojik deneme (Son 3 Ay)
  const mehmet = createdStudents.find(s => s.email === 'mehmet.demir@gmail.com');
  if (mehmet) {
    const examsData = [];
    for (let i = 0; i < 10; i++) {
      // 90 gün öncesinden başlayarak günümüze doğru kronolojik sıralama
      const daysAgo = 90 - (i * 9); 
      const examDate = new Date();
      examDate.setDate(examDate.getDate() - daysAgo);

      // İlerleyen haftalarda yavaş yavaş artan netler
      const tytTurkish = 20 + i; 
      const tytMath = 10 + i; 
      const tytSocial = 8 + Math.floor(i / 2); 
      const tytScience = 5 + Math.floor(i / 3); 
      const totalNet = tytTurkish + tytMath + tytSocial + tytScience;

      examsData.push({
        examName: `TYT Genel Deneme ${i + 1}`,
        examType: 'TYT',
        totalNet: totalNet,
        tytTurkish: tytTurkish,
        tytMath: tytMath,
        tytSocial: tytSocial,
        tytScience: tytScience,
        studentId: mehmet.id,
        createdAt: examDate
      });

      // AYT için aynı tarihin ertesi günü veya aynı günü
      const aytDate = new Date(examDate);
      aytDate.setHours(aytDate.getHours() + 2); // Birkaç saat sonra
      
      const aytMath = 10 + i * 2; // 10 -> 28
      const aytScience = 5 + i * 2; // 5 -> 23
      const aytEdSos1 = 15 + i; // 15 -> 24
      const aytSocial2 = 12 + i; // 12 -> 21
      
      // Toplam net AYT için farklı bir hesaplamadır, rastgele genel bir toplam veriyoruz
      const aytTotalNet = aytMath + aytScience + aytEdSos1 + aytSocial2;

      examsData.push({
        examName: `AYT Genel Deneme ${i + 1}`,
        examType: 'AYT',
        totalNet: aytTotalNet,
        aytMath: aytMath,
        aytScience: aytScience,
        aytEdSos1: aytEdSos1,
        aytSocial2: aytSocial2,
        studentId: mehmet.id,
        createdAt: aytDate
      });

      // YDT için
      const ydtDate = new Date(examDate);
      ydtDate.setHours(ydtDate.getHours() + 4); // Birkaç saat sonra
      
      const ydtLangCorrect = 50 + i * 2; // 50'den başlayıp yavaşça artar
      const ydtLangWrong = 8;
      const ydtTotalNet = ydtLangCorrect - (ydtLangWrong * 0.25);

      examsData.push({
        examName: `YDT Genel Deneme ${i + 1}`,
        examType: 'YDT',
        totalNet: ydtTotalNet,
        ydtLanguage: ydtTotalNet,
        studentId: mehmet.id,
        createdAt: ydtDate
      });
    }
    
    await prisma.practiceExam.createMany({
      data: examsData
    });
    console.log('Mehmet Demir için son 3 aya ait 10 adet TYT ve 10 adet AYT denemesi oluşturuldu.');
  }

  console.log('Seed başarıyla tamamlandı: 20 Öğrenci oluşturuldu.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
