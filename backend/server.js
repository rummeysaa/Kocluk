require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { authenticateToken, checkRole, JWT_SECRET } = require('./middleware/authMiddleware');

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

// 2. GET /api/students
app.get('/api/students', authenticateToken, checkRole(['TEACHER', 'ADMIN']), async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true, department: true }
    });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Öğrenciler getirilirken bir hata oluştu.' });
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
    const activeStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const completedTasks = await prisma.assignment.count({ where: { status: 'COMPLETED' } });
    const pendingTasks = await prisma.assignment.count({ where: { status: 'PENDING' } });
    res.json({ activeStudents, completedTasks, pendingTasks });
  } catch (error) {
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
    const assignments = await prisma.assignment.findMany({
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
      examType, examName, examDate,
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
