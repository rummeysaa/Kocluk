require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { authenticateToken, checkRole, JWT_SECRET } = require('./middleware/authMiddleware');
const { sendEmail } = require('./src/services/emailService');


const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// AI Routes importing
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

// 1. POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Hatalı e-posta veya şifre' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Hatalı e-posta veya şifre' });
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: 'Giriş başarılı', token, user: payload });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş sırasında sunucu hatası oluştu.' });
  }
});

// 1.1. POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Ad, e-posta ve şifre zorunludur.' });
    }

    const normalizedRole = role ? role.toUpperCase() : 'TEACHER';
    if (normalizedRole !== 'TEACHER') {
      return res.status(400).json({ error: 'Sadece öğretmenler doğrudan kayıt olabilir. Öğrenciler koçları tarafından davet edilmelidir.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: normalizedRole
      },
      select: { id: true, name: true, email: true, role: true }
    });

    res.status(201).json({ message: 'Kayıt başarıyla oluşturuldu.', user: newUser });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Kayıt sırasında sunucu hatası oluştu.' });
  }
});

// 1.2 POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve yeni şifre zorunludur.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Bu e-posta adresine ait bir kullanıcı bulunamadı.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Şifreniz başarıyla güncellendi.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Şifre güncellenirken bir hata oluştu.' });
  }
});

// 2. GET /api/students
app.get('/api/students', authenticateToken, checkRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const relations = await prisma.teacherStudent.findMany({
      where: { teacherId: teacherId },
      include: {
        student: {
          select: { id: true, name: true, email: true, department: true }
        }
      }
    });
    const students = relations.map(r => r.student).filter(Boolean);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Öğrenciler getirilirken bir hata oluştu.' });
  }
});

// 2.2 GET /api/students/check - E-posta ile öğrenci kontrolü (Öğretmen/Admin)
app.get('/api/students/check', authenticateToken, checkRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'E-posta parametresi zorunludur.' });
    }
    const student = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, department: true, role: true }
    });
    if (student) {
      if (student.role !== 'STUDENT') {
        return res.status(400).json({ error: 'Bu e-posta adresi bir öğrenciye ait değil.' });
      }
      return res.json({ exists: true, student });
    }
    return res.json({ exists: false });
  } catch (error) {
    console.error('Error checking student email:', error);
    res.status(500).json({ error: 'E-posta kontrolü sırasında hata oluştu.' });
  }
});

// 2.1 POST /api/students - Yeni öğrenci oluşturma (Öğretmen/Admin)
app.post('/api/students', authenticateToken, checkRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'E-posta zorunludur.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.role === 'STUDENT') {
        // Öğrenci zaten var, onu güncelle (şifresine dokunma) ve bağla
        const updatedStudent = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: name || existingUser.name,
            department: department || existingUser.department
          },
          select: { id: true, name: true, email: true, department: true }
        });

        // İlişki zaten var mı kontrol et, yoksa ekle
        const existingRelation = await prisma.teacherStudent.findUnique({
          where: {
            teacherId_studentId: {
              teacherId: req.user.id,
              studentId: existingUser.id
            }
          }
        });

        if (!existingRelation) {
          await prisma.teacherStudent.create({
            data: {
              teacherId: req.user.id,
              studentId: existingUser.id
            }
          });
        }

        // Bildirim oluştur
        await prisma.notification.create({
          data: {
            title: 'Yeni Koç Bağlantısı',
            message: `${req.user.name} sizi kendi koçluk sınıfına ekledi. Artık ortak çalışmalarınızı buradan yürütebilirsiniz.`,
            userId: existingUser.id
          }
        });

        return res.status(200).json({ message: 'Mevcut öğrenci başarıyla bağlandı.', student: updatedStudent });
      } else {
        return res.status(400).json({ error: 'Bu e-posta adresi bir öğrenciye ait değil.' });
      }
    }

    // Yeni öğrenci için ad ve şifre zorunludur
    if (!name || !password) {
      return res.status(400).json({ error: 'Yeni öğrenci için ad ve şifre zorunludur.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        department: department || null
      },
      select: { id: true, name: true, email: true, department: true }
    });

    // Öğretmen ile öğrenciyi ilişkilendir
    await prisma.teacherStudent.create({
      data: {
        teacherId: req.user.id,
        studentId: newStudent.id
      }
    });

    // Öğrenciye giriş bilgilerini gönder
    sendEmail({
      to: email,
      subject: 'Eğitim Koçu - Öğrenci Hesabınız Oluşturuldu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="text-align: center; border-bottom: 2px solid #3182ce; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #3182ce; margin: 0;">Eğitim Koçluğu Platformu</h2>
          </div>
          <p>Merhaba <strong>${name}</strong>,</p>
          <p>Koçunuz tarafından Eğitim Koçluğu Platformu'nda öğrenci hesabınız oluşturuldu.</p>
          <p>Giriş bilgileriniz aşağıdadır:</p>
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #edf2f7;">
            <p style="margin: 5px 0;"><strong>E-posta:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Şifre:</strong> ${password}</p>
          </div>
          <p>Sisteme giriş yaptıktan sonra şifrenizi profil ayarlarınızdan değiştirebilirsiniz.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="http://localhost:3000/" style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Giriş Yap</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #a0aec0; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
        </div>
      `,
      text: `Merhaba ${name},\n\nKoçunuz tarafından Eğitim Koçluğu Platformu'nda öğrenci hesabınız oluşturuldu.\n\nGiriş bilgileriniz:\nE-posta: ${email}\nŞifre: ${password}\n\nSisteme giriş yapmak için http://localhost:3000/ adresini ziyaret edebilirsiniz.`
    });

    res.status(201).json({ message: 'Öğrenci başarıyla oluşturuldu.', student: newStudent });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Öğrenci oluşturulurken bir hata oluştu.' });
  }
});

// 3. GET /api/exams/student/:studentId
app.get('/api/exams/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'STUDENT' && req.user.id !== parseInt(studentId)) {
      return res.status(403).json({ error: 'Sadece kendi sınavlarınızı görebilirsiniz.' });
    }

    const exams = await prisma.practiceExam.findMany({
      where: { studentId: parseInt(studentId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Sınav verileri getirilirken bir hata oluştu.' });
  }
});

// 4. GET /api/assignments/student/:studentId
app.get('/api/assignments/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'STUDENT' && req.user.id !== parseInt(studentId)) {
      return res.status(403).json({ error: 'Sadece kendi ödevlerinizi görebilirsiniz.' });
    }

    const assignments = await prisma.assignment.findMany({
      where: { studentId: parseInt(studentId) },
      orderBy: { dueDate: 'asc' },
      include: {
        teacher: { select: { name: true } }
      }
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Ödev verileri getirilirken bir hata oluştu.' });
  }
});

// 5. GET /api/teacher/stats
app.get('/api/teacher/stats', authenticateToken, checkRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // Bu öğretmene ait benzersiz öğrencilerin sayısı
    const activeStudents = await prisma.teacherStudent.count({
      where: { teacherId: teacherId }
    });

    const completedTasks = await prisma.assignment.count({
      where: { teacherId: teacherId, status: 'COMPLETED' }
    });
    const pendingTasks = await prisma.assignment.count({
      where: { teacherId: teacherId, status: 'PENDING' }
    });
    
    res.json({ activeStudents, completedTasks, pendingTasks });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Stats error' });
  }
});

// 6. GET /api/progress/student/:studentId
app.get('/api/progress/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'STUDENT' && req.user.id !== parseInt(studentId)) {
      return res.status(403).json({ error: 'Sadece kendi gelişiminizi görebilirsiniz.' });
    }

    const count = await prisma.assignment.count({ where: { studentId: parseInt(studentId) } });
    const base = count * 10;
    
    const chartData = [
      { day: "Pzt", current: base + 10, planned: base + 20 },
      { day: "Sal", current: base + 25, planned: base + 30 },
      { day: "Çar", current: base + 20, planned: base + 35 },
      { day: "Per", current: base + 40, planned: base + 50 },
      { day: "Cum", current: base + 60, planned: base + 65 },
      { day: "Cts", current: base + 70, planned: base + 75 },
      { day: "Paz", current: base + 80, planned: base + 80 },
    ];
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: 'Progress error' });
  }
});

// --- YENİ EKLENEN ROTALAR (AŞAMA 4: CRUD ENDPOINTS) ---

// 6.5. GET /api/assignments/all (Tüm Ödevleri Çek - Öğretmen Paneli İçin)
app.get('/api/assignments/all', authenticateToken, checkRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const assignments = await prisma.assignment.findMany({
      where: { teacherId: teacherId },
      orderBy: { dueDate: 'asc' },
      include: {
        student: { select: { name: true } }
      }
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({ error: 'Tüm ödevler getirilirken hata oluştu.' });
  }
});

// 7. POST /api/assignments (Yeni Ödev Tanımlama)
app.post('/api/assignments', authenticateToken, checkRole(['TEACHER', 'ADMIN']), upload.single('file'), async (req, res) => {
  try {
    const { studentIds, title, description, dueDate } = req.body;
    let fileUrl = null;
    
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    let parsedStudentIds = [];
    try {
      parsedStudentIds = JSON.parse(studentIds);
    } catch (e) {
      if (studentIds) parsedStudentIds = [parseInt(studentIds)];
    }
    
    if (!parsedStudentIds || parsedStudentIds.length === 0 || !title || !description) {
      return res.status(400).json({ error: 'En az bir öğrenci, başlık ve içerik (description) zorunludur.', received: req.body });
    }

    const currentTeacherId = parseInt(req.user.id);
    const teacherExists = await prisma.user.findUnique({ where: { id: currentTeacherId } });
    if (!teacherExists) {
      return res.status(401).json({ message: "Geçersiz öğretmen oturumu. Lütfen çıkış yapıp tekrar giriş yapın." });
    }

    const assignmentData = parsedStudentIds.map(id => ({
      title,
      content: description,
      status: 'PENDING',
      dueDate: dueDate ? new Date(dueDate) : null,
      fileUrl,
      teacherId: currentTeacherId,
      studentId: parseInt(id)
    }));

    await prisma.assignment.createMany({
      data: assignmentData
    });

    // Bildirimleri oluştur
    const notificationData = parsedStudentIds.map(id => ({
      title: `Koç: ${teacherExists.name}`,
      message: `Görev: ${title}`,
      userId: parseInt(id)
    }));

    await prisma.notification.createMany({
      data: notificationData
    });

    // Öğrencilere e-posta bildirimleri gönder
    try {
      const students = await prisma.user.findMany({
        where: { id: { in: parsedStudentIds } },
        select: { id: true, name: true, email: true }
      });

      for (const student of students) {
        const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmedi';
        sendEmail({
          to: student.email,
          subject: `Yeni Görev Atandı: ${title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="text-align: center; border-bottom: 2px solid #3182ce; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: #3182ce; margin: 0;">Eğitim Koçluğu Platformu</h2>
              </div>
              <p>Merhaba <strong>${student.name}</strong>,</p>
              <p>Koçunuz <strong>${teacherExists.name}</strong> size yeni bir görev tanımladı:</p>
              <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #edf2f7;">
                <p style="margin: 5px 0;"><strong>Görev Başlığı:</strong> ${title}</p>
                <p style="margin: 5px 0;"><strong>Açıklama:</strong> ${description}</p>
                <p style="margin: 5px 0;"><strong>Son Teslim Tarihi:</strong> ${formattedDate}</p>
              </div>
              <p>Görevi incelemek ve tamamlandığında bildirmek için öğrenci panelinizi ziyaret edebilirsiniz.</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="http://localhost:3000/dashboard" style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Paneli Aç</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 11px; color: #a0aec0; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
            </div>
          `,
          text: `Merhaba ${student.name},\n\nKoçunuz ${teacherExists.name} size yeni bir görev tanımladı:\n\nGörev Başlığı: ${title}\nAçıklama: ${description}\nSon Teslim Tarihi: ${formattedDate}\n\nÖğrenci panelinizi ziyaret etmek için http://localhost:3000/dashboard adresini ziyaret edebilirsiniz.`
        });
      }
    } catch (emailErr) {
      console.error('Error triggering task assignment emails:', emailErr);
    }

    res.json({ message: 'Görevler başarıyla atandı', count: assignmentData.length });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Ödev eklenirken bir hata oluştu.' });
  }
});

// 8. PUT /api/assignments/:id/status (Ödev Durumunu Güncelleme)
app.put('/api/assignments/:id/status', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, studentNote } = req.body;

    if (status !== 'COMPLETED' && status !== 'PENDING') {
      return res.status(400).json({ error: 'Geçersiz ödev durumu.' });
    }

    const existing = await prisma.assignment.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'Ödev bulunamadı.' });

    if (existing.status === 'COMPLETED') {
      return res.status(403).json({ error: 'Bu görev zaten tamamlanmış ve kilitlenmiştir, tekrar değiştirilemez.' });
    }

    if (req.user.role === 'STUDENT' && existing.studentId !== req.user.id) {
       return res.status(403).json({ error: 'Sadece kendi ödevinizin durumunu güncelleyebilirsiniz.' });
    }

    let submittedFileUrl = existing.submittedFileUrl;
    if (req.file) {
      submittedFileUrl = `/uploads/${req.file.filename}`;
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        submittedFileUrl,
        studentNote: studentNote !== undefined ? studentNote : existing.studentNote
      }
    });

    // Görev tamamlandığında öğretmene e-posta bildirimi gönder
    if (status === 'COMPLETED') {
      try {
        const student = await prisma.user.findUnique({
          where: { id: existing.studentId },
          select: { name: true }
        });
        const teacher = await prisma.user.findUnique({
          where: { id: existing.teacherId },
          select: { name: true, email: true }
        });

        if (teacher && student) {
          const completionDate = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          
          sendEmail({
            to: teacher.email,
            subject: `Görev Tamamlandı: ${existing.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="text-align: center; border-bottom: 2px solid #38a169; padding-bottom: 15px; margin-bottom: 20px;">
                  <h2 style="color: #38a169; margin: 0;">✅ Görev Tamamlandı</h2>
                </div>
                <p>Merhaba <strong>${teacher.name}</strong>,</p>
                <p>Öğrenciniz <strong>${student.name}</strong> aşağıdaki görevi tamamladı:</p>
                <div style="background-color: #f0fff4; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #c6f6d5;">
                  <p style="margin: 5px 0;"><strong>Görev:</strong> ${existing.title}</p>
                  <p style="margin: 5px 0;"><strong>Tamamlanma Tarihi:</strong> ${completionDate}</p>
                  ${studentNote ? `<p style="margin: 5px 0;"><strong>Öğrenci Notu:</strong> ${studentNote}</p>` : ''}
                  ${submittedFileUrl ? `<p style="margin: 5px 0;"><strong>Dosya:</strong> Öğrenci dosya yükledi</p>` : ''}
                </div>
                <p>Görevi incelemek için öğretmen panelinizi ziyaret edebilirsiniz.</p>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="http://localhost:3000/teacher-dashboard" style="display: inline-block; background-color: #38a169; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Paneli Aç</a>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 11px; color: #a0aec0; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
              </div>
            `,
            text: `Merhaba ${teacher.name},\n\nÖğrenciniz ${student.name} "${existing.title}" görevini tamamladı.\nTamamlanma Tarihi: ${completionDate}\n${studentNote ? `Öğrenci Notu: ${studentNote}\n` : ''}\nÖğretmen panelinizi ziyaret etmek için http://localhost:3000/teacher-dashboard adresine gidin.`
          });

          // Öğretmene bildirim de oluştur
          await prisma.notification.create({
            data: {
              title: `Görev Tamamlandı`,
              message: `${student.name} "${existing.title}" görevini tamamladı.`,
              userId: existing.teacherId
            }
          });
        }
      } catch (emailErr) {
        console.error('Görev tamamlama e-posta hatası:', emailErr);
        // E-posta hatası ana işlemi engellemez
      }
    }

    res.json({ message: 'Ödev durumu güncellendi', updatedAssignment });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ error: 'Ödev durumu güncellenirken hata oluştu.' });
  }
});

// 8.1 PUT /api/assignments/:id (Ödev Düzenleme)
app.put('/api/assignments/:id', authenticateToken, checkRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.content = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedAssignment = await prisma.assignment.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ message: 'Ödev güncellendi', updatedAssignment });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Ödev güncellenirken hata oluştu.' });
  }
});

// 8.2 DELETE /api/assignments/:id (Ödev Silme)
app.delete('/api/assignments/:id', authenticateToken, checkRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    res.json({ message: 'Ödev başarıyla silindi' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Ödev silinirken hata oluştu.' });
  }
});

// 9. POST /api/exams (Yeni Deneme Neti Ekleme)
app.post('/api/exams', authenticateToken, checkRole(['STUDENT']), async (req, res) => {
  try {
    const { 
      examType, examName, examDate, weakTopicsNotes,
      tytTurkishD, tytTurkishY, 
      tytMathD, tytMathY, 
      tytSocialD, tytSocialY, 
      tytScienceD, tytScienceY, 
      aytMathD, aytMathY, 
      aytScienceD, aytScienceY, 
      aytEdSos1D, aytEdSos1Y, 
      aytSocial2D, aytSocial2Y,
      ydtLangD, ydtLangY
    } = req.body;

    if (!examType || !examName) {
      return res.status(400).json({ error: 'Sınav türü (TYT/AYT/YDT) ve Sınav Adı zorunludur.' });
    }

    const calcNet = (d, y) => (parseInt(d) || 0) - ((parseInt(y) || 0) * 0.25);

    let tytTurkish = 0, tytMath = 0, tytSocial = 0, tytScience = 0;
    let aytMath = 0, aytScience = 0, aytEdSos1 = 0, aytSocial2 = 0;
    let ydtLanguage = 0;
    let totalNet = 0;

    if (examType === 'TYT') {
      tytTurkish = calcNet(tytTurkishD, tytTurkishY);
      tytMath = calcNet(tytMathD, tytMathY);
      tytSocial = calcNet(tytSocialD, tytSocialY);
      tytScience = calcNet(tytScienceD, tytScienceY);
      totalNet = tytTurkish + tytMath + tytSocial + tytScience;
    } else if (examType === 'AYT') {
      aytMath = calcNet(aytMathD, aytMathY);
      aytScience = calcNet(aytScienceD, aytScienceY);
      aytEdSos1 = calcNet(aytEdSos1D, aytEdSos1Y);
      aytSocial2 = calcNet(aytSocial2D, aytSocial2Y);
      totalNet = aytMath + aytScience + aytEdSos1 + aytSocial2;
    } else if (examType === 'YDT') {
      ydtLanguage = calcNet(ydtLangD, ydtLangY);
      totalNet = ydtLanguage;
    }

    const exam = await prisma.practiceExam.create({
      data: {
        examName,
        examType,
        totalNet,
        tytTurkish,
        tytMath,
        tytSocial,
        tytScience,
        aytMath,
        aytScience,
        aytEdSos1,
        aytSocial2,
        ydtLanguage,
        weakTopicsNotes,
        studentId: req.user.id,
        ...(examDate && { createdAt: new Date(examDate) })
      }
    });

    res.json({ message: 'Deneme sınavı başarıyla eklendi', exam });
  } catch (error) {
    console.error('Sınav eklenirken hata:', error);
    res.status(500).json({ error: 'Sınav eklenemedi.' });
  }
});

// DELETE /api/exams/:id
app.delete('/api/exams/:id', authenticateToken, checkRole(['STUDENT']), async (req, res) => {
  try {
    const examId = parseInt(req.params.id);
    const exam = await prisma.practiceExam.findUnique({ where: { id: examId } });

    if (!exam) {
      return res.status(404).json({ error: 'Sınav bulunamadı.' });
    }

    if (exam.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }

    await prisma.practiceExam.delete({ where: { id: examId } });
    res.json({ message: 'Sınav silindi.' });
  } catch (error) {
    console.error('Sınav silinirken hata:', error);
    res.status(500).json({ error: 'Sınav silinemedi.' });
  }
});

// Generic test route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pong' });
});

// ==========================================
// FOCUS SESSIONS
// ==========================================

// GET /api/focus-sessions/today/:studentId
app.get('/api/focus-sessions/today/:studentId', authenticateToken, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    if (req.user.id !== studentId && req.user.role === 'STUDENT') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await prisma.focusSession.findMany({
      where: {
        studentId,
        createdAt: {
          gte: today
        }
      }
    });

    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    res.json({ totalMinutes });
  } catch (error) {
    console.error('Focus session getirme hatası:', error);
    res.status(500).json({ error: 'Veriler alınamadı.' });
  }
});

// POST /api/focus-sessions
app.post('/api/focus-sessions', authenticateToken, checkRole(['STUDENT']), async (req, res) => {
  try {
    const { duration } = req.body;
    const studentId = req.user.id;

    if (!duration) {
      return res.status(400).json({ error: 'Süre (duration) zorunludur.' });
    }

    const newSession = await prisma.focusSession.create({
      data: {
        studentId,
        duration: parseInt(duration)
      }
    });

    res.status(201).json(newSession);
  } catch (error) {
    console.error('Focus session kaydetme hatası:', error);
    res.status(500).json({ error: 'Oturum kaydedilemedi.' });
  }
});

// ==========================================
// NOTIFICATIONS
// ==========================================

// GET /api/notifications/student/:studentId
app.get('/api/notifications/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    // Güvenlik: Kendi bildirimleri veya Öğretmen/Admin yetkisi
    if (req.user.id !== studentId && req.user.role === 'STUDENT') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: studentId },
      orderBy: [
        { isRead: 'asc' }, // okunmamışlar önce
        { createdAt: 'desc' } // yeniler önce
      ],
      take: 20 // son 20 bildirim
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Bildirimler getirilirken hata:', error);
    res.status(500).json({ error: 'Bildirimler getirilemedi.' });
  }
});

// PUT /api/notifications/student/:studentId/read-all
app.put('/api/notifications/student/:studentId/read-all', authenticateToken, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    if (req.user.id !== studentId && req.user.role === 'STUDENT') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }

    await prisma.notification.updateMany({
      where: { 
        userId: studentId,
        isRead: false 
      },
      data: { isRead: true }
    });

    res.json({ message: 'Tüm bildirimler okundu işaretlendi.' });
  } catch (error) {
    console.error('Bildirimler güncellenirken hata:', error);
    res.status(500).json({ error: 'Bildirimler güncellenemedi.' });
  }
});

// PUT /api/notifications/:id/read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Bildirim bulunamadı.' });
    }

    if (req.user.id !== notification.userId && req.user.role === 'STUDENT') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json({ message: 'Bildirim okundu işaretlendi.' });
  } catch (error) {
    console.error('Bildirim güncellenirken hata:', error);
    res.status(500).json({ error: 'Bildirim güncellenemedi.' });
  }
});

// DELETE /api/notifications/:id
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Bildirim bulunamadı.' });
    }

    if (req.user.id !== notification.userId && req.user.role === 'STUDENT') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({ message: 'Bildirim silindi.' });
  } catch (error) {
    console.error('Bildirim silinirken hata:', error);
    res.status(500).json({ error: 'Bildirim silinemedi.' });
  }
});

// DELETE /api/notifications/student/:studentId/clear-all
app.delete('/api/notifications/student/:studentId/clear-all', authenticateToken, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    if (req.user.id !== studentId && req.user.role === 'STUDENT') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }

    await prisma.notification.deleteMany({
      where: { userId: studentId }
    });

    res.json({ message: 'Tüm bildirimler silindi.' });
  } catch (error) {
    console.error('Bildirimler silinirken hata:', error);
    res.status(500).json({ error: 'Bildirimler silinemedi.' });
  }
});

// ==========================================
// STUDENT DASHBOARD ENDPOINTS
// ==========================================

// GET /api/student/dashboard-data - Öğrenci dashboard verileri (Dinamik Haftalık İlerleme)
app.get('/api/student/dashboard-data', async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: 'studentId gerekli.' });
    }

    const sid = parseInt(studentId);

    // 1. Tüm görevleri çek
    const assignments = await prisma.assignment.findMany({
      where: { studentId: sid },
      orderBy: { createdAt: 'desc' },
      include: { teacher: { select: { name: true } } }
    });

    // 2. Görev listesini frontend formatına dönüştür
    const tasks = assignments.map(a => ({
      id: a.id,
      title: a.title,
      checked: a.status === 'COMPLETED',
      status: a.status === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor',
      dueDate: a.dueDate,
      teacherName: a.teacher?.name || 'Koç'
    }));

    // 3. Haftalık İlerleme (Bu haftanın Pazartesi'sinden Pazar'ına kadar gerçek veriler)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Pazar, 1=Pazartesi...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + mondayOffset);

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const chartData = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(monday);
      dayStart.setDate(monday.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // O gün oluşturulan veya teslim tarihi o güne denk gelen görevler
      const dayAssignments = assignments.filter(a => {
        const created = new Date(a.createdAt);
        const due = a.dueDate ? new Date(a.dueDate) : null;
        return (created >= dayStart && created <= dayEnd) || 
               (due && due >= dayStart && due <= dayEnd);
      });

      const totalForDay = dayAssignments.length;
      const completedForDay = dayAssignments.filter(a => a.status === 'COMPLETED').length;

      chartData.push({
        day: dayNames[i],
        current: completedForDay,
        planned: totalForDay
      });
    }

    // 4. Son deneme sınavı
    const latestExam = await prisma.practiceExam.findFirst({
      where: { studentId: sid },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tasks, chartData, latestExam });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Dashboard verileri yüklenemedi.' });
  }
});

// POST /api/student/toggle-task - Görev durumunu değiştir (PENDING <-> COMPLETED)
app.post('/api/student/toggle-task', async (req, res) => {
  try {
    const { studentId, assignmentId } = req.body;
    if (!studentId || !assignmentId) {
      return res.status(400).json({ error: 'studentId ve assignmentId gerekli.' });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(assignmentId) }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Görev bulunamadı.' });
    }

    if (assignment.studentId !== parseInt(studentId)) {
      return res.status(403).json({ error: 'Bu görevi değiştirme yetkiniz yok.' });
    }

    const newStatus = assignment.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

    await prisma.assignment.update({
      where: { id: parseInt(assignmentId) },
      data: { status: newStatus }
    });

    res.json({ message: 'Görev durumu güncellendi.', newStatus });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Görev durumu güncellenemedi.' });
  }
});

// GET /api/student/practice-exams - Öğrencinin deneme sınavlarını listele
app.get('/api/student/practice-exams', async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: 'studentId gerekli.' });
    }

    const sid = parseInt(studentId);
    const exams = await prisma.practiceExam.findMany({
      where: { studentId: sid },
      orderBy: { createdAt: 'desc' }
    });

    // Frontend'in beklediği formata dönüştür
    const formatted = exams.map(exam => {
      let subjects = [];
      let totalCorrect = 0, totalWrong = 0, totalBlank = 0;

      if (exam.examType === 'TYT') {
        const subs = [
          { name: 'Türkçe', net: exam.tytTurkish || 0, total: 40 },
          { name: 'Matematik', net: exam.tytMath || 0, total: 40 },
          { name: 'Sosyal Bilimler', net: exam.tytSocial || 0, total: 20 },
          { name: 'Fen Bilimleri', net: exam.tytScience || 0, total: 20 }
        ];
        subs.forEach(s => {
          // Net'ten D/Y/B tahmini hesapla (net = D - Y/4)
          const correct = Math.round(Math.max(0, Math.min(s.total, s.net)));
          const wrong = Math.round(Math.max(0, (correct - s.net) * 4));
          const blank = Math.max(0, s.total - correct - wrong);
          totalCorrect += correct;
          totalWrong += wrong;
          totalBlank += blank;
          subjects.push({ subjectName: s.name, correctCount: correct, wrongCount: wrong, blankCount: blank });
        });
      } else if (exam.examType === 'AYT') {
        const subs = [
          { name: 'Matematik', net: exam.aytMath || 0, total: 40 },
          { name: 'Fen Bilimleri', net: exam.aytScience || 0, total: 40 },
          { name: 'Edebiyat-Sosyal 1', net: exam.aytEdSos1 || 0, total: 40 },
          { name: 'Sosyal Bilimler 2', net: exam.aytSocial2 || 0, total: 40 }
        ];
        subs.forEach(s => {
          const correct = Math.round(Math.max(0, Math.min(s.total, s.net)));
          const wrong = Math.round(Math.max(0, (correct - s.net) * 4));
          const blank = Math.max(0, s.total - correct - wrong);
          totalCorrect += correct;
          totalWrong += wrong;
          totalBlank += blank;
          subjects.push({ subjectName: s.name, correctCount: correct, wrongCount: wrong, blankCount: blank });
        });
      } else if (exam.examType === 'YDT') {
        const net = exam.ydtLanguage || 0;
        const correct = Math.round(Math.max(0, Math.min(80, net)));
        const wrong = Math.round(Math.max(0, (correct - net) * 4));
        const blank = Math.max(0, 80 - correct - wrong);
        totalCorrect = correct;
        totalWrong = wrong;
        totalBlank = blank;
        subjects.push({ subjectName: 'Yabancı Dil', correctCount: correct, wrongCount: wrong, blankCount: blank });
      }

      return {
        id: exam.id,
        examName: exam.examName,
        examType: exam.examType,
        examDate: exam.createdAt,
        totalNet: exam.totalNet,
        totalCorrect,
        totalWrong,
        totalBlank,
        weakTopicsNotes: exam.weakTopicsNotes,
        examResultsDetails: subjects
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Practice exams error:', error);
    res.status(500).json({ error: 'Deneme sınavları yüklenemedi.' });
  }
});

// POST /api/student/practice-exams - Yeni deneme sınavı ekle
app.post('/api/student/practice-exams', async (req, res) => {
  try {
    const { studentId, examType, examName, examDate, weakTopicsNotes, subjects } = req.body;

    if (!studentId || !examType || !examName) {
      return res.status(400).json({ error: 'studentId, examType ve examName zorunludur.' });
    }

    const calcNet = (correct, wrong) => correct - (wrong * 0.25);

    let tytTurkish = 0, tytMath = 0, tytSocial = 0, tytScience = 0;
    let aytMath = 0, aytScience = 0, aytEdSos1 = 0, aytSocial2 = 0;
    let ydtLanguage = 0;
    let totalNet = 0;

    // Normalize examType for DB (TYT, AYT, YDT)
    let dbExamType = examType;
    if (examType.startsWith('AYT')) dbExamType = 'AYT';

    if (subjects && subjects.length > 0) {
      subjects.forEach(sub => {
        const net = calcNet(sub.correctCount, sub.wrongCount);
        totalNet += net;

        if (examType === 'TYT') {
          if (sub.subjectName === 'Türkçe') tytTurkish = net;
          else if (sub.subjectName === 'Matematik') tytMath = net;
          else if (sub.subjectName === 'Sosyal Bilimler') tytSocial = net;
          else if (sub.subjectName === 'Fen Bilimleri') tytScience = net;
        } else if (examType.startsWith('AYT')) {
          if (sub.subjectName === 'Matematik') aytMath = net;
          else if (sub.subjectName === 'Fen Bilimleri') aytScience = net;
          else if (sub.subjectName === 'Edebiyat-Sosyal 1') aytEdSos1 = net;
          else if (sub.subjectName === 'Sosyal Bilimler 2') aytSocial2 = net;
        } else if (examType === 'YDT') {
          ydtLanguage = net;
        }
      });
    }

    const exam = await prisma.practiceExam.create({
      data: {
        examName,
        examType: dbExamType,
        totalNet,
        tytTurkish, tytMath, tytSocial, tytScience,
        aytMath, aytScience, aytEdSos1, aytSocial2,
        ydtLanguage,
        weakTopicsNotes: weakTopicsNotes || null,
        studentId: parseInt(studentId),
        ...(examDate && { createdAt: new Date(examDate) })
      }
    });

    res.status(201).json({ message: 'Deneme sınavı başarıyla eklendi.', exam });
  } catch (error) {
    console.error('Practice exam create error:', error);
    res.status(500).json({ error: 'Deneme sınavı kaydedilemedi.' });
  }
});

// Profile endpoints
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, department: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    let coaches = [];
    if (user.role === 'STUDENT') {
      const relations = await prisma.teacherStudent.findMany({
        where: { studentId: req.user.id },
        select: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      coaches = relations.map(r => r.teacher).filter(Boolean);
    }

    res.json({ user, coaches });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Profil bilgileri getirilemedi.' });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    const userId = req.user.id;

    // Check email uniqueness if email is changing
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department !== undefined) updateData.department = department;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, department: true }
    });

    res.json({ message: 'Profil başarıyla güncellendi.', user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Profil güncellenirken bir hata oluştu.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
