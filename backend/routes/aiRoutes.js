const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini AI istemcisini baslat
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Multer yapilandirmasi (Gorsel yukleme icin)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece .png, .jpg ve .jpeg formatlari kabul edilir!'));
    }
  }
});

// Dosyayi Base64 formatina ceviren yardimci fonksiyon (Gemini inlineData icin)
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

// GET /api/ai/sessions - Ogrencinin sohbet odalarini listele
router.get('/sessions', authenticateToken, checkRole(['STUDENT']), async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { studentId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    console.error('Sohbet odalari getirilirken hata:', error);
    res.status(500).json({ error: 'Sohbet odalari yuklenemedi.' });
  }
});

// GET /api/ai/sessions/:sessionId/messages - Secilen odanin mesajlarini getir
router.get('/sessions/:sessionId/messages', authenticateToken, checkRole(['STUDENT']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Odanin ogrenciye ait olup olmadigini kontrol et
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Bu odaya erisim yetkiniz yok.' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error('Mesajlar getirilirken hata:', error);
    res.status(500).json({ error: 'Mesajlar yuklenemedi.' });
  }
});

// POST /api/ai/chat - Ana analiz ve sohbet noktasi (Multimodal)
router.post('/chat', authenticateToken, checkRole(['STUDENT']), upload.single('file'), async (req, res) => {
  try {
    let { message, sessionId, actionType } = req.body;
    
    const isInitialCardTrigger = !message && !req.file && actionType;

    if (!message && !req.file && !isInitialCardTrigger) {
      return res.status(400).json({ error: 'Lutfen bir mesaj veya gorsel gonderin.' });
    }

    // Sohbet odasi kontrol veya olusturma
    if (!sessionId) {
      const newSession = await prisma.chatSession.create({
        data: {
          studentId: req.user.id,
          title: 'Yeni Sohbet'
        }
      });
      sessionId = newSession.id;
    } else {
      const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
      if (!session || session.studentId !== req.user.id) {
        return res.status(403).json({ error: 'Bu odaya erisim yetkiniz yok.' });
      }
    }

    // Ogrencinin mesajini veritabanina kaydet (Eger initial trigger degilse)
    if (!isInitialCardTrigger) {
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      await prisma.chatMessage.create({
        data: {
          sessionId,
          sender: 'student',
          message: message || '',
          imageUrl
        }
      });
    }

    let aiResponseText = "";

    if (isInitialCardTrigger) {
      if (actionType === 'solve_question') {
        aiResponseText = "Selam! Çözemediğin sorunun fotoğrafını yüklemeye hazırsın. Resmi buraya bırak veya aşağıdaki ikona tıkla, hemen inceleyelim!";
      } else if (actionType === 'analyze_nets') {
        aiResponseText = "Harika, deneme check-up'ı zamanı! Senin için veritabanındaki deneme geçmişini tarayıp ders ders durumunu, netlerinin gidişatını ve sınav ortalamalarını analiz edebilirim. Analiz etmemi istediğin sınav türünü ve son kaç denemene bakacağımızı (Örn: 'Son 5 TYT denememi incele' veya 'Son 3 YDT durumuma bak') aşağıya yazman yeterli!";
      } else if (actionType === 'strategy_and_methods') {
        aiResponseText = "Sınav stratejileri ve çalışma metotları alanına hoş geldin! Ders bazlı eksiklerin, süre yönetimi taktikleri veya verimli çalışma yöntemlerinin yanı sıra; TYT/AYT/YDT'de tam olarak anlamadığın ve zorlandığın bir konu varsa bana yazabilirsin. Sana o konuyu en sade, akılda kalıcı metotlarla sıfırdan anlatabilirim. Yoğunlaşmak istediğin noktayı veya dersi aşağıya yaz, hemen başlayalım!";
      } else {
        aiResponseText = "Nasıl yardımcı olabilirim?";
      }
    } else {
      // Temel System Prompt
      let systemInstruction = `Sen Turkiye'deki YKS (TYT, AYT, YDT) sistemine son derece hakim, profesyonel ve moral verici bir AI Sinav Kocusun. Ogrenciye alan ayrimi yapmadan (Sayisal, Sozel, EA, Dil) rehberlik et.
KESİN FORMAT KURALI: 
- Tüm matematiksel ifadeleri, oranları, denklemleri, formülleri ve kesirleri KESİNLİKLE standart LaTeX formatında üret.
- Satır içi (inline) ifadeleri tek dolar işareti arasında göster (Örn: $1/4$, $\\frac{1}{4}$ veya $2 \\div 2 = 1$).
- Ayrı bir satırda büyük vurgulanması gereken formülleri çift dolar işareti arasında göster (Örn: $$ x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} $$).
- Düz metin ile LaTeX kodlarını asla birbirine karıştırma, her sayısal veya sembolik matematiksel veri mutlaka $ veya $$ blokları içinde kalmalıdır.`;

      // Dinamik Prompt Ekleme
      if (actionType === 'solve_question') {
        systemInstruction += "Görseldeki ÖSYM/YKS tarzı deneme sorusunu analiz et. Doğru cevabı bul ve çözümü adımları net, anlaşılır ve Türkçe ile dök.";
      } else if (actionType === 'analyze_nets') {
        systemInstruction += `Sen veri analitiği çok güçlü bir eğitim koçusun. Veritabanından gelen verileri incele. KESİN KURALLAR:
1. Soru Sayısı Sabitleri: Oransal analiz yapabilmen için toplam soru sayılarını bilmen gerekir:
- TYT: Türkçe (40), Matematik (40), Sosyal (20), Fen (20)
- AYT: Mat (40), Fen (40), Edebiyat/Sos-1 (40), Sos-2 (40)
- YDT: Dil (80)

2. Uzun paragraflar, giriş-sonuç cümleleri ve selamlama ("Merhaba değerli öğrencim" vb.) KESİNLİKLE YASAKTIR. Direkt verilere odaklan.

3. Her ders için SADECE şu Markdown şablonunu kullan ve asla dışına çıkma:
**[Ders Adı]**
* Geçmiş Netler: [veritabanından gelen netleri virgülle sırala] -> Trend: (Sadece tek kelime: "Yükseliş", "Düşüş" veya "Dalgalı")
* Ortalama: [Net Ortalama] / [Toplam Soru Sayısı] (Örn: 17 / 40)
* Başarı Oranı: %X (Ortalama netin, toplam soru sayısına yüzdelik oranı. Örn: 17/40 = %42.5)
* Tavsiye: (En fazla 1 cümlelik nokta atışı tavsiye)

4. Tüm dersler bittikten sonra en alta backend tarafından hesaplanan şu bilgiyi yaz:
**Genel Ortalama Net:** (Sistem bilgisinde verilen gerçek ortalamayı buraya yaz)

5. 🚨 Stratejik Önceliklendirme Mantığı (Gelişim Potansiyeline Göre):
Genel Ortalama Net satırının hemen altına duruma göre "🚨 Acil Eylem & Çalışma Sırası" VEYA netler genel olarak yükselişteyse "🚀 Başarıyı Koruma ve Potansiyeli Artırma Sırası" adında yeni bir alt başlık ekle. 
KESİN KURAL: Bu sıralamayı yaparken dersleri ham nete göre değil, "Gelişim Potansiyeli" oranına göre sırala.
- Formül: Gelişim Potansiyeli = %100 - Başarı Oranı
- Gelişim potansiyeli en yüksek olan (yani toplam soru sayısına oranla en çok net artırma alanı bırakan) ders 1. sıraya yerleşmelidir.
Öğrenciye tam olarak şu formatta bir öncelik sırası ver:
1. [Öncelikli Ders]: Bu dersin toplam soru sayısına oranla başarı yüzdesi %X seviyesindedir ve %Y'lik bir gelişim potansiyeli barındırmaktadır.
2. [İkinci Öncelikli Ders]: ...
3. [Üçüncü Öncelikli Ders]: ...`;
        
        // 1. Akıllı İstek Ayrıştırma (Sınav Türü ve Sayı Tespiti)
        let requestedExamType = undefined;
        let limitCount = 15;
        const lowerMessage = (message || "").toLowerCase();
        
        if (lowerMessage.includes("tyt")) requestedExamType = "TYT";
        else if (lowerMessage.includes("ayt")) requestedExamType = "AYT";
        else if (lowerMessage.includes("ydt") || lowerMessage.includes("dil")) requestedExamType = "YDT";

        const numberMatch = lowerMessage.match(/(\d+)/);
        if (numberMatch && parseInt(numberMatch[1]) > 0 && parseInt(numberMatch[1]) <= 50) {
          limitCount = parseInt(numberMatch[1]);
        }

        // Sorgu filtresi oluştur
        const queryWhere = { studentId: req.user.id };
        if (requestedExamType) {
          queryWhere.examType = requestedExamType;
        }

        try {
          const recentExams = await prisma.practiceExam.findMany({
            where: queryWhere,
            orderBy: { createdAt: 'desc' },
            take: limitCount
          });
          
          if (recentExams.length > 0) {
            // Kronolojik Sıralama Düzeltmesi (Eskiden Yeniye)
            const chronologicalExams = recentExams.reverse();

            // 2. Matematiksel Doğruluk (Ortalama Hesaplama)
            let totalScoreSum = 0;
            chronologicalExams.forEach(exam => {
              totalScoreSum += (exam.totalNet || 0);
            });
            const actualAverage = (totalScoreSum / chronologicalExams.length).toFixed(2);
            const actualExamTypeStr = requestedExamType ? requestedExamType : "Tüm";

            let examsSummary = `Öğrencinin Yalnızca Talep Ettiği ${actualExamTypeStr} Sınavlarına Ait Netleri (Eskiden Yeniye Sıralı):\n`;
            chronologicalExams.forEach((exam, index) => {
              examsSummary += `${index + 1}. Deneme (${exam.examType}): Toplam Net: ${exam.totalNet || 0} - `;
              if (exam.examType === 'TYT') {
                examsSummary += `Türkçe: ${exam.tytTurkish || 0}, Mat: ${exam.tytMath || 0}, Sos: ${exam.tytSocial || 0}, Fen: ${exam.tytScience || 0}\n`;
              } else if (exam.examType === 'AYT') {
                examsSummary += `Mat: ${exam.aytMath || 0}, Fen: ${exam.aytScience || 0}, Edebiyat/Sos-1: ${exam.aytEdSos1 || 0}, Sos-2: ${exam.aytSocial2 || 0}\n`;
              } else if (exam.examType === 'YDT') {
                examsSummary += `Dil: ${exam.ydtLanguage || 0}\n`;
              }
            });
            systemInstruction += `\n\n[SİSTEM BİLGİSİ: Öğrencinin talep ettiği ${actualExamTypeStr} sınav türüne ait veriler KRONOLOJİK OLARAK (eskiden yeniye) aşağıdadır. GENEL ORTALAMA NET: ${actualAverage}. Lütfen analizde bu gerçek ortalamayı kullan:]\n${examsSummary}`;
          } else {
            systemInstruction += `\n\n[SİSTEM BİLGİSİ: Öğrencinin henüz sisteme kayıtlı bir deneme verisi bulunmuyor. Lütfen SADECE ŞUNU SÖYLE: 'Sistemde girilmiş ${requestedExamType || 'TYT/AYT/YDT'} deneme sınavı kaydınız bulunamadı. Lütfen önce deneme sonuçlarınızı sisteme ekleyin.']`;
          }
        } catch (error) {
          console.error("Deneme verileri çekilirken veritabanı hatası:", error);
          systemInstruction += `\n\n[SİSTEM BİLGİSİ: Veritabanına ulaşılamadı. Lütfen SADECE ŞUNU SÖYLE: 'Sistemde girilmiş ${requestedExamType || 'TYT/AYT/YDT'} deneme sınavı kaydınız bulunamadı veya verilere şu an ulaşılamıyor. Lütfen önce deneme sonuçlarınızı sisteme ekleyin.']`;
        }
      } else if (actionType === 'strategy_and_methods') {
        systemInstruction += "Öğrenciye ders bazlı eksikleri kapatma ve sınav taktikleri sun. EĞER öğrenci belirli bir dersin konusunu anlamadığını belirtirse (Örn: Fonksiyonlar, Trigo vb.), o konuyu en popüler kalıcı öğrenme metotlarını kullanarak, en basit ve akıcı adımlarla sıfırdan anlat.";
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        systemInstruction: systemInstruction 
      });

      const prompt = message || "Gorseli analiz eder misin?";
      const imageParts = [];

      if (req.file) {
        const mimeType = req.file.mimetype;
        const filePath = req.file.path;
        imageParts.push(fileToGenerativePart(filePath, mimeType));
      }

      // Gemini API cagrisi (Multimodal eger gorsel varsa)
      const result = await model.generateContent([prompt, ...imageParts]);
      aiResponseText = result.response.text();
    }

    // AI Yanitini kaydet
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender: 'ai',
        message: aiResponseText
      }
    });

    // Eger bu odadaki ilk AI yaniti ise, icerikten mantikli bir baslik cikart ve odayi guncelle
    const messageCount = await prisma.chatMessage.count({ where: { sessionId } });
    if (messageCount <= 2) {
      try {
        const titleModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const titleResult = await titleModel.generateContent(`Iste AI sinav kocunun yaniti: "${aiResponseText}". Bu yaniti ozetleyen 3-4 kelimelik kisa ve zekice bir baslik ver. Baslik disinda hicbir aciklama yazma.`);
        let newTitle = titleResult.response.text().trim().replace(/["']/g, ''); // Tirnaklari temizle
        if(newTitle.length > 50) newTitle = newTitle.substring(0, 50) + "...";
        
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { title: newTitle }
        });
      } catch (err) {
        console.error('Baslik uretilirken hata:', err);
      }
    }

    res.json(aiMessage);

  } catch (error) {
    console.error('Gemini/Prisma Detaylı Hata:', error);
    res.status(500).json({ error: 'AI ile iletisim kurulurken bir hata olustu.' });
  }
});

module.exports = router;
