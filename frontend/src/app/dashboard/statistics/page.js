"use client";
import React, { useState, useEffect } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";

// Renk paleti
const COLORS = {
  dogru: "#22c55e", // Yeşil
  yanlis: "#ef4444", // Kırmızı
  bos: "#cbd5e1"     // Gri
};

const EXAM_SUBJECTS = {
  TYT: [
    { name: "Türkçe", total: 40 },
    { name: "Matematik", total: 40 },
    { name: "Sosyal Bilimler", total: 20 },
    { name: "Fen Bilimleri", total: 20 }
  ],
  AYT_SAYISAL: [
    { name: "Matematik", total: 40 },
    { name: "Fen Bilimleri", total: 40 }
  ],
  AYT_ESIT_AGIRLIK: [
    { name: "Matematik", total: 40 },
    { name: "Edebiyat-Sosyal 1", total: 40 }
  ],
  AYT_SOZEL: [
    { name: "Edebiyat-Sosyal 1", total: 40 },
    { name: "Sosyal Bilimler 2", total: 40 }
  ]
};

const EXAM_TITLES = {
  TYT: "TYT Deneme Sınavı",
  AYT_SAYISAL: "AYT (Sayısal) Deneme Sınavı",
  AYT_ESIT_AGIRLIK: "AYT (Eşit Ağırlık) Deneme Sınavı",
  AYT_SOZEL: "AYT (Sözel) Deneme Sınavı"
};

// Tekrar kullanılabilir Deneme Sınavı Kartı Bileşeni
function ExamCard({ title, date, totalCorrect, totalWrong, totalBlank, totalNet, breakdown, weakTopicsNotes }) {
  const pieData = [
    { name: "Doğru", value: totalCorrect },
    { name: "Yanlış", value: totalWrong },
    { name: "Boş", value: totalBlank }
  ];
  
  const formattedDate = new Date(date).toLocaleDateString("tr-TR", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start mb-1">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">{formattedDate}</span>
      </div>
      <p className="text-sm text-slate-500 mb-6">Toplam {totalCorrect + totalWrong + totalBlank} Soru</p>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
        <div className="w-40 h-40 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={COLORS.dogru} />
                <Cell fill={COLORS.yanlis} />
                <Cell fill={COLORS.bos} />
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1e293b', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">{Number(totalNet).toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-medium">Net</span>
          </div>
        </div>
        
        <div className="flex flex-col justify-center space-y-3 w-full md:pl-4">
           <div className="flex justify-between items-center text-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-green-500"></div>
               <span className="text-slate-600 font-medium">Doğru</span>
             </div>
             <span className="font-bold text-slate-800 text-base">{totalCorrect}</span>
           </div>
           <div className="flex justify-between items-center text-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500"></div>
               <span className="text-slate-600 font-medium">Yanlış</span>
             </div>
             <span className="font-bold text-slate-800 text-base">{totalWrong}</span>
           </div>
           <div className="flex justify-between items-center text-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-slate-300"></div>
               <span className="text-slate-600 font-medium">Boş</span>
             </div>
             <span className="font-bold text-slate-800 text-base">{totalBlank}</span>
           </div>
        </div>
      </div>
      
      {/* Ders Bazlı Kırılım */}
      <div className="border-t border-slate-100 pt-5 mt-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ders Dağılımı</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
          {breakdown && breakdown.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-xs text-slate-500 mb-1">
                {item.subject?.name || item.subjectName} 
              </span>
              <div className="flex gap-2 items-baseline">
                <span className="text-sm font-semibold text-green-600">{item.correctCount}D</span>
                <span className="text-sm font-semibold text-red-500">{item.wrongCount}Y</span>
                <span className="text-xs text-slate-400">{item.blankCount}B</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zayıf Konu Notları */}
      {weakTopicsNotes && (
        <div className="border-t border-slate-100 pt-4 mt-4 bg-amber-50/50 -mx-6 -mb-6 p-6 rounded-b-3xl border-b border-amber-100/50">
          <div className="flex gap-2 items-start">
            <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Zayıf/Hatalı Konular</h4>
              <p className="text-xs text-amber-700 font-medium whitespace-pre-wrap">{weakTopicsNotes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatisticsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);

  // Form State
  const [examType, setExamType] = useState("TYT");
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [weakTopicsNotes, setWeakTopicsNotes] = useState("");
  const [subjectValues, setSubjectValues] = useState({
    "Türkçe": { correct: 0, wrong: 0, blank: 40 },
    "Matematik": { correct: 0, wrong: 0, blank: 40 },
    "Sosyal Bilimler": { correct: 0, wrong: 0, blank: 20 },
    "Fen Bilimleri": { correct: 0, wrong: 0, blank: 20 }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchExams(parsedUser.id);
    }
  }, []);

  const fetchExams = async (studentId) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/student/practice-exams?studentId=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setExams(data || []);
      } else {
        const errData = await res.json();
        setError(errData.error || "Denemeler yüklenemedi.");
      }
    } catch (err) {
      console.error(err);
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleExamTypeChange = (type) => {
    setExamType(type);
    const newValues = {};
    EXAM_SUBJECTS[type].forEach(sub => {
      newValues[sub.name] = { correct: 0, wrong: 0, blank: sub.total };
    });
    setSubjectValues(newValues);
  };

  const handleSubjectChange = (subjectName, field, value, totalQuestions) => {
    const val = Math.max(0, parseInt(value) || 0);
    setSubjectValues(prev => {
      const current = prev[subjectName] || { correct: 0, wrong: 0, blank: totalQuestions };
      let newCorrect = field === 'correct' ? val : current.correct;
      let newWrong = field === 'wrong' ? val : current.wrong;
      
      if (newCorrect > totalQuestions) newCorrect = totalQuestions;
      if (newCorrect + newWrong > totalQuestions) {
        newWrong = totalQuestions - newCorrect;
      }
      
      const newBlank = totalQuestions - newCorrect - newWrong;
      
      return {
        ...prev,
        [subjectName]: {
          correct: newCorrect,
          wrong: newWrong,
          blank: newBlank
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!examName.trim()) {
      alert("Lütfen sınav adını girin.");
      return;
    }

    try {
      setIsSubmitting(true);
      const formattedSubjects = Object.keys(subjectValues).map(name => ({
        subjectName: name,
        correctCount: subjectValues[name].correct,
        wrongCount: subjectValues[name].wrong,
        blankCount: subjectValues[name].blank
      }));

      const payload = {
        studentId: user.id,
        examType,
        examName,
        examDate,
        weakTopicsNotes,
        subjects: formattedSubjects
      };

      const res = await fetch("http://localhost:5000/api/student/practice-exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        setExamName("");
        setWeakTopicsNotes("");
        // Reset subjects
        handleExamTypeChange(examType);
        fetchExams(user.id);
      } else {
        const errData = await res.json();
        alert(errData.error || "Sınav kaydedilemedi.");
      }
    } catch (err) {
      console.error(err);
      alert("Bağlantı hatası oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTrendData = () => {
    // Sort exams by date ascending
    const sorted = [...exams].sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
    
    // Map them for Recharts
    return sorted.map(exam => {
      const dateObj = new Date(exam.examDate);
      const formattedDate = dateObj.toLocaleDateString("tr-TR", { day: 'numeric', month: 'short' });
      
      const isTyt = exam.examType === 'TYT';
      return {
        date: formattedDate,
        tyt: isTyt ? Number(exam.totalNet) : null,
        ayt: !isTyt ? Number(exam.totalNet) : null
      };
    });
  };

  const activeTrendData = getTrendData();

  return (
    <div className="min-h-full pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Deneme Analizleri</h1>
          <p className="text-slate-500 mt-2">Son girdiğiniz denemelerin detaylı performans istatistikleri ve net durumları.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all text-sm shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Yeni Deneme Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-xl mx-auto shadow-sm my-10">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Henüz Deneme Eklenmemiş</h2>
          <p className="text-slate-500 mb-8">Gelişiminizi ve net trendlerinizi takip etmek için ilk deneme sınavı sonucunuzu şimdi ekleyin!</p>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all text-sm inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            İlk Denemeyi Ekle
          </button>
        </div>
      ) : (
        <>
          {/* Çark Kartları (Pie Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {exams.map((exam) => (
              <ExamCard 
                key={exam.id}
                title={exam.examName} 
                date={exam.examDate}
                totalCorrect={exam.totalCorrect} 
                totalWrong={exam.totalWrong}
                totalBlank={exam.totalBlank}
                totalNet={exam.totalNet}
                breakdown={exam.examResultsDetails}
                weakTopicsNotes={exam.weakTopicsNotes}
              />
            ))}
          </div>

          {/* Genel İlerleme Grafiği (Line Chart) */}
          <div className="mt-12 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-800">Dönemsel Net İlerlemesi</h2>
              <p className="text-sm text-slate-500 mt-1">Girdiğiniz denemelerin tarihsel olarak net gelişimi.</p>
            </div>

            {/* Çizgi Grafiği */}
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13 }} 
                    dy={10} 
                  />
                  <YAxis 
                    domain={[0, 120]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: 500 }} />
                  
                  <Line 
                    name="TYT Neti" 
                    type="monotone" 
                    dataKey="tyt" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }} 
                    activeDot={{ r: 7 }} 
                    connectNulls
                  />
                  <Line 
                    name="AYT Neti" 
                    type="monotone" 
                    dataKey="ayt" 
                    stroke="#8b5cf6" 
                    strokeWidth={4} 
                    dot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#8b5cf6" }} 
                    activeDot={{ r: 7 }} 
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* YENİ DENEME EKLEME MODALI */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Yeni Deneme Sınavı Ekle</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sınav Türü */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-600">Sınav Türü</label>
                  <select 
                    value={examType}
                    onChange={(e) => handleExamTypeChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="TYT">TYT (Temel Yeterlilik Testi)</option>
                    <option value="AYT_SAYISAL">AYT (Sayısal)</option>
                    <option value="AYT_ESIT_AGIRLIK">AYT (Eşit Ağırlık)</option>
                    <option value="AYT_SOZEL">AYT (Sözel)</option>
                  </select>
                </div>

                {/* Sınav Tarihi */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-600">Sınav Tarihi</label>
                  <input 
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Sınav Adı */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-600">Sınav Adı / Yayını</label>
                <input 
                  type="text"
                  placeholder="Örnek: Özdebir Türkiye Geneli 2"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              {/* Ders Kırılımları */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">Ders Bazlı Soru Sayıları</h3>
                <div className="space-y-4">
                  {EXAM_SUBJECTS[examType].map((sub) => {
                    const currentValues = subjectValues[sub.name] || { correct: 0, wrong: 0, blank: sub.total };
                    return (
                      <div key={sub.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="shrink-0">
                          <span className="font-bold text-slate-800 text-sm block">{sub.name}</span>
                          <span className="text-xs text-slate-400">Maksimum {sub.total} Soru</span>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {/* Doğru */}
                          <div className="flex flex-col items-center gap-1 w-20">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Doğru</span>
                            <input 
                              type="number"
                              min="0"
                              max={sub.total}
                              value={currentValues.correct}
                              onChange={(e) => handleSubjectChange(sub.name, 'correct', e.target.value, sub.total)}
                              className="w-full text-center px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold bg-white text-green-600 focus:outline-none focus:border-green-500"
                            />
                          </div>

                          {/* Yanlış */}
                          <div className="flex flex-col items-center gap-1 w-20">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Yanlış</span>
                            <input 
                              type="number"
                              min="0"
                              max={sub.total}
                              value={currentValues.wrong}
                              onChange={(e) => handleSubjectChange(sub.name, 'wrong', e.target.value, sub.total)}
                              className="w-full text-center px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold bg-white text-red-500 focus:outline-none focus:border-red-500"
                            />
                          </div>

                          {/* Boş */}
                          <div className="flex flex-col items-center gap-1 w-20">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Boş</span>
                            <input 
                              type="number"
                              disabled
                              value={currentValues.blank}
                              className="w-full text-center px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold bg-slate-100 text-slate-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Zayıf Konu Notları */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-600">Zayıf Konu Notları (En Çok Yanlış/Boş Yapılan Konular)</label>
                <textarea 
                  rows="3"
                  placeholder="Örnek: Matematikte Üslü Sayılar ve Kümeler konularında hatalarım var. Fizikte Optik konusu çalışılmalı."
                  value={weakTopicsNotes}
                  onChange={(e) => setWeakTopicsNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl active:scale-95 transition-all text-sm"
                >
                  Vazgeç
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl active:scale-95 transition-all text-sm flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    "Kaydet"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
