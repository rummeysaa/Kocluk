import React, { useState, useEffect } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";

// Renk paleti
const COLORS = {
  dogru: "#22c55e",
  yanlis: "#ef4444",
  bos: "#cbd5e1"
};

// Yeni Deneme Ekleme Modalı
function ExamCreateModal({ isOpen, onClose, onExamCreated }) {
  const [examType, setExamType] = useState("TYT");
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    tytTurkishD: "", tytTurkishY: "",
    tytMathD: "", tytMathY: "",
    tytSocialD: "", tytSocialY: "",
    tytScienceD: "", tytScienceY: "",
    aytMathD: "", aytMathY: "",
    aytScienceD: "", aytScienceY: "",
    aytEdSos1D: "", aytEdSos1Y: "",
    aytSocial2D: "", aytSocial2Y: "",
    ydtLangD: "", ydtLangY: "",
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Hata durumunu temizle
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!examName) return alert("Lütfen sınav adı giriniz.");
    if (!examDate) return alert("Lütfen sınav tarihini seçiniz.");

    const newErrors = {};
    const validateSubject = (dStr, yStr, maxQuestions, subjectLabel, dKey, yKey) => {
      const d = parseInt(dStr) || 0;
      const y = parseInt(yStr) || 0;
      if (d < 0) newErrors[dKey] = `${subjectLabel} doğru sayısı negatif olamaz!`;
      if (y < 0) newErrors[yKey] = `${subjectLabel} yanlış sayısı negatif olamaz!`;
      if (d + y > maxQuestions) {
        newErrors[dKey] = `${subjectLabel} için D+Y toplamı en fazla ${maxQuestions} olabilir!`;
        newErrors[yKey] = `${subjectLabel} için D+Y toplamı en fazla ${maxQuestions} olabilir!`;
      }
    };

    if (examType === "TYT") {
      validateSubject(formData.tytTurkishD, formData.tytTurkishY, 40, "Türkçe", "tytTurkishD", "tytTurkishY");
      validateSubject(formData.tytMathD, formData.tytMathY, 40, "Matematik", "tytMathD", "tytMathY");
      validateSubject(formData.tytSocialD, formData.tytSocialY, 20, "Sosyal", "tytSocialD", "tytSocialY");
      validateSubject(formData.tytScienceD, formData.tytScienceY, 20, "Fen Bilimleri", "tytScienceD", "tytScienceY");
    } else if (examType === "AYT") {
      validateSubject(formData.aytMathD, formData.aytMathY, 40, "Matematik", "aytMathD", "aytMathY");
      validateSubject(formData.aytScienceD, formData.aytScienceY, 40, "Fen Bilimleri", "aytScienceD", "aytScienceY");
      validateSubject(formData.aytEdSos1D, formData.aytEdSos1Y, 40, "Edebiyat-Sos1", "aytEdSos1D", "aytEdSos1Y");
      validateSubject(formData.aytSocial2D, formData.aytSocial2Y, 40, "Sosyal-2", "aytSocial2D", "aytSocial2Y");
    } else if (examType === "YDT") {
      validateSubject(formData.ydtLangD, formData.ydtLangY, 80, "Yabancı Dil", "ydtLangD", "ydtLangY");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ examType, examName, examDate, ...formData })
      });

      if (response.ok) {
        onExamCreated(); // refresh exams
        onClose();
        setExamName("");
        setExamDate("");
        setFormData({
          tytTurkishD: "", tytTurkishY: "", tytMathD: "", tytMathY: "",
          tytSocialD: "", tytSocialY: "", tytScienceD: "", tytScienceY: "",
          aytMathD: "", aytMathY: "", aytScienceD: "", aytScienceY: "",
          aytEdSos1D: "", aytEdSos1Y: "", aytSocial2D: "", aytSocial2Y: "",
          ydtLangD: "", ydtLangY: "",
        });
      } else {
        alert("Sınav eklenirken hata oluştu.");
      }
    } catch (error) {
      console.error("Sınav ekleme hatası:", error);
    }
    setIsSubmitting(false);
  };

  const renderInputs = (label, dName, yName) => {
    const errorMsg = errors[dName] || errors[yName];
    return (
      <div className="flex flex-col mb-5">
        <span className="text-sm font-semibold text-slate-700 mb-2">{label}</span>
        <div className="flex gap-4">
          <input 
            type="number" placeholder="Doğru (Opsiyonel)" name={dName} value={formData[dName]} onChange={handleInputChange}
            className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ${errors[dName] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
          />
          <input 
            type="number" placeholder="Yanlış (Opsiyonel)" name={yName} value={formData[yName]} onChange={handleInputChange}
            className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ${errors[yName] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-red-500/20 focus:border-red-500'}`}
          />
        </div>
        {errorMsg && <span className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errorMsg}</span>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-full">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Yeni Deneme Ekle</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-calendar-scroll">
          <form id="examForm" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sınav Adı</label>
              <input 
                type="text" required placeholder="Örn: Özdebir Türkiye Geneli" value={examName} onChange={(e) => setExamName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sınav Tarihi</label>
              <input 
                type="date" required value={examDate} onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sınav Türü</label>
              <select 
                value={examType} onChange={(e) => setExamType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
              >
                <option value="TYT">TYT</option>
                <option value="AYT">AYT</option>
                <option value="YDT">YDT</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ders Sonuçları (Opsiyonel)</h3>
              {examType === 'TYT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  {renderInputs("Türkçe", "tytTurkishD", "tytTurkishY")}
                  {renderInputs("Matematik", "tytMathD", "tytMathY")}
                  {renderInputs("Sosyal Bilgiler", "tytSocialD", "tytSocialY")}
                  {renderInputs("Fen Bilimleri", "tytScienceD", "tytScienceY")}
                </div>
              )}
              
              {examType === 'AYT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  {renderInputs("Matematik", "aytMathD", "aytMathY")}
                  {renderInputs("Fen Bilimleri", "aytScienceD", "aytScienceY")}
                  {renderInputs("Edebiyat-Sos1", "aytEdSos1D", "aytEdSos1Y")}
                  {renderInputs("Sosyal-2", "aytSocial2D", "aytSocial2Y")}
                </div>
              )}

              {examType === 'YDT' && (
                <div className="grid grid-cols-1 gap-x-6">
                  {renderInputs("Yabancı Dil", "ydtLangD", "ydtLangY")}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            İptal
          </button>
          <button type="submit" form="examForm" disabled={isSubmitting} className="flex-1 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-70">
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Tekrar kullanılabilir Deneme Sınavı Kartı Bileşeni
function ExamCard({ title, totalQuestions, data, breakdown, headerRight }) {
  const dogru = data.find(d => d.name === "Doğru")?.value || 0;
  const yanlis = data.find(d => d.name === "Yanlış")?.value || 0;
  const bos = data.find(d => d.name === "Boş")?.value || 0;
  const net = dogru - (yanlis * 0.25);
  
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full justify-between hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">{title}</h2>
          <p className="text-sm text-slate-500">Toplam {totalQuestions} Soru</p>
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 flex-1">
        <div className="w-40 h-40 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
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
            <span className="text-2xl font-bold text-slate-800">{net.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-medium">Net</span>
          </div>
        </div>
        
        <div className="flex flex-col justify-center space-y-3 w-full md:pl-4">
           <div className="flex justify-between items-center text-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-green-500"></div>
               <span className="text-slate-600 font-medium">Doğru</span>
             </div>
             <span className="font-bold text-slate-800 text-base">{dogru}</span>
           </div>
           <div className="flex justify-between items-center text-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500"></div>
               <span className="text-slate-600 font-medium">Yanlış</span>
             </div>
             <span className="font-bold text-slate-800 text-base">{yanlis}</span>
           </div>
           <div className="flex justify-between items-center text-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-slate-300"></div>
               <span className="text-slate-600 font-medium">Boş</span>
             </div>
             <span className="font-bold text-slate-800 text-base">{bos}</span>
           </div>
        </div>
      </div>
      
      <div className="border-t border-slate-100 pt-5 mt-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ders Dağılımı</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-4 min-h-[104px]">
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-xs text-slate-500 mb-1">{item.subject} <span className="text-slate-400">({item.total})</span></span>
              <div className="flex gap-2 items-baseline">
                <span className="text-sm font-semibold text-green-600">{item.d}D</span>
                <span className="text-sm font-semibold text-red-500">{item.y}Y</span>
              </div>
            </div>
          ))}
          {/* Simetri için görünmez yer tutucular (Eğer ders sayısı 4'ten azsa, dikey boyutu TYT ile eşitlemek için) */}
          {Array.from({ length: Math.max(0, 4 - breakdown.length) }).map((_, idx) => (
            <div key={`empty-${idx}`} className="flex flex-col invisible" aria-hidden="true">
              <span className="text-xs mb-1">Boş <span className="text-slate-400">(0)</span></span>
              <div className="flex gap-2 items-baseline">
                <span className="text-sm font-semibold text-green-600">0D</span>
                <span className="text-sm font-semibold text-red-500">0Y</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState("analysis");
  const [historyFilter, setHistoryFilter] = useState("Tümü");
  
  const [timeFilter, setTimeFilter] = useState("all");
  const [examTab, setExamTab] = useState("TYT");
  const [aytTab, setAytTab] = useState("SAY");
  const [examView, setExamView] = useState("AYT");
  
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedExamId, setExpandedExamId] = useState(null);

  const fetchExams = async () => {
    const userStr = localStorage.getItem('user');
    let studentId = 4; // Fallback
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) studentId = user.id;
      } catch (e) {
        console.error("User parse error", e);
      }
    }

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:5000/api/exams/student/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setExams(data);
      } else {
        setExams([]);
      }
    } catch (err) {
      console.error("API hatası:", err);
      setError("Sınav verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDeleteExam = async (id) => {
    if (!window.confirm("Bu sınavı silmek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/exams/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setExams(prev => prev.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error("Sınav silinirken hata:", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Veriler yükleniyor...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  // Analiz Grafikleri için Datayı Hazırlama (Backend DESC döndürdüğü için grafiğe verirken ASC yapıyoruz)
  const parsedTrendData = [...exams].reverse().map(exam => {
    const d = new Date(exam.createdAt);
    const dateStr = d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    return { date: dateStr, examType: exam.examType, net: exam.totalNet, rawDate: d };
  });

  const activeTrendData = parsedTrendData.filter(d => {
    const matchExam = d.examType === examTab;
    const isCurrentMonth = d.rawDate.getMonth() === new Date().getMonth() && d.rawDate.getFullYear() === new Date().getFullYear();
    const matchTime = timeFilter === "all" || (timeFilter === "month" && isCurrentMonth);
    return matchExam && matchTime;
  });

  // Helper to estimate D and Y from Net
  const getDYFromNet = (net) => {
    if (net == null) return { d: 0, y: 0 };
    const d = Math.ceil(net);
    const y = (d - net) * 4;
    return { d, y };
  };

  const sortedExams = [...exams].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // TYT Hesaplama
  const lastTyt = sortedExams.find(e => e.examType === 'TYT');
  let tytData = [ { name: "Doğru", value: 0 }, { name: "Yanlış", value: 0 }, { name: "Boş", value: 120 } ];
  let tytBreakdown = [];

  if (lastTyt) {
    const tr = getDYFromNet(lastTyt.tytTurkish);
    const mat = getDYFromNet(lastTyt.tytMath);
    const fen = getDYFromNet(lastTyt.tytScience);
    const sos = getDYFromNet(lastTyt.tytSocial);
    
    const totalD = tr.d + mat.d + fen.d + sos.d;
    const totalY = tr.y + mat.y + fen.y + sos.y;
    
    tytData = [
      { name: "Doğru", value: totalD }, 
      { name: "Yanlış", value: totalY }, 
      { name: "Boş", value: 120 - totalD - totalY }
    ];
    
    tytBreakdown = [
      { subject: "Türkçe", total: 40, d: tr.d, y: tr.y },
      { subject: "Matematik", total: 40, d: mat.d, y: mat.y },
      { subject: "Fen Bilimleri", total: 20, d: fen.d, y: fen.y },
      { subject: "Sosyal Bilgiler", total: 20, d: sos.d, y: sos.y }
    ];
  }

  // AYT Hesaplama
  const lastAyt = sortedExams.find(e => e.examType === 'AYT');
  let aytData = [ { name: "Doğru", value: 0 }, { name: "Yanlış", value: 0 }, { name: "Boş", value: 80 } ];
  let aytBreakdown = [];

  if (lastAyt) {
    const mat = getDYFromNet(lastAyt.aytMath);
    const fen = getDYFromNet(lastAyt.aytScience);
    const edSos = getDYFromNet(lastAyt.aytEdSos1);
    const sos2 = getDYFromNet(lastAyt.aytSocial2);
    
    if (aytTab === 'SAY') {
      const totalD = mat.d + fen.d;
      const totalY = mat.y + fen.y;
      aytData = [ { name: "Doğru", value: totalD }, { name: "Yanlış", value: totalY }, { name: "Boş", value: 80 - totalD - totalY } ];
      aytBreakdown = [ { subject: "Matematik", total: 40, d: mat.d, y: mat.y }, { subject: "Fen Bilimleri", total: 40, d: fen.d, y: fen.y } ];
    } else if (aytTab === 'EA') {
      const totalD = mat.d + edSos.d;
      const totalY = mat.y + edSos.y;
      aytData = [ { name: "Doğru", value: totalD }, { name: "Yanlış", value: totalY }, { name: "Boş", value: 80 - totalD - totalY } ];
      aytBreakdown = [ { subject: "Matematik", total: 40, d: mat.d, y: mat.y }, { subject: "Edebiyat-Sos1", total: 40, d: edSos.d, y: edSos.y } ];
    } else if (aytTab === 'SÖZ') {
      const totalD = edSos.d + sos2.d;
      const totalY = edSos.y + sos2.y;
      aytData = [ { name: "Doğru", value: totalD }, { name: "Yanlış", value: totalY }, { name: "Boş", value: 80 - totalD - totalY } ];
      aytBreakdown = [ { subject: "Edebiyat-Sos1", total: 40, d: edSos.d, y: edSos.y }, { subject: "Sosyal-2", total: 40, d: sos2.d, y: sos2.y } ];
    }
  }

  // YDT Hesaplama
  const lastYdt = sortedExams.find(e => e.examType === 'YDT');
  let ydtData = [ { name: "Doğru", value: 0 }, { name: "Yanlış", value: 0 }, { name: "Boş", value: 80 } ];
  let ydtBreakdown = [];

  if (lastYdt) {
    const lang = getDYFromNet(lastYdt.ydtLanguage);
    ydtData = [ 
      { name: "Doğru", value: lang.d }, 
      { name: "Yanlış", value: lang.y }, 
      { name: "Boş", value: 80 - lang.d - lang.y } 
    ];
    ydtBreakdown = [ 
      { subject: "Yabancı Dil", total: 80, d: lang.d, y: lang.y } 
    ];
  }

  const aytHeaderRight = (
    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0 border border-slate-200/60">
      {['SAY', 'EA', 'SÖZ'].map(tab => (
        <button key={tab} onClick={() => setAytTab(tab)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${aytTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          {tab}
        </button>
      ))}
    </div>
  );

  const filteredHistory = exams.filter(e => historyFilter === "Tümü" || e.examType === historyFilter);

  const renderSubjectDetail = (title, netValue) => {
    const { d, y } = getDYFromNet(netValue);
    const calculatedNet = (d - y * 0.25).toFixed(2);
    return (
      <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 truncate">{title}</p>
        <div className="flex justify-between items-center mt-auto gap-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-semibold">{d}D</span>
            <span className="text-red-500 font-semibold">{y}Y</span>
          </div>
          <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md text-xs shrink-0 whitespace-nowrap">
            {calculatedNet} Net
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full pb-12 flex flex-col h-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sınav Merkezi</h1>
          <p className="text-slate-500 mt-2">Deneme sınavı analizlerinizi görüntüleyin ve yeni deneme ekleyin.</p>
        </div>
      </div>

      {/* Ana Sekme Butonları */}
      <div className="flex bg-slate-100/70 p-1.5 rounded-2xl mb-8 w-max">
        <button 
          onClick={() => setActiveTab("analysis")} 
          className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'analysis' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Genel Analiz
        </button>
        <button 
          onClick={() => setActiveTab("history")} 
          className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Geçmiş Denemelerim
        </button>
      </div>

      {activeTab === "analysis" && (
        <div className="space-y-8 animate-fade-in">
          {exams.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Henüz Deneme Bulunmuyor</h2>
              <p className="text-slate-500 mt-2">Geçmiş Denemelerim sekmesinden yeni bir deneme ekleyebilirsiniz.</p>
            </div>
          ) : (
            <>
              {/* Çark Kartları (Pie Charts) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                
                {/* TYT Sol Sütun (Simetri için sarmalayıcı) */}
                <div className="flex flex-col h-full">
                  {/* Sağdaki butonlarla hizalamak için masaüstünde görünmez bir boşluk */}
                  <div className="hidden lg:block h-[32px] mb-3 opacity-0 pointer-events-none"></div>
                  <div className="flex-1 flex flex-col">
                    <ExamCard title="TYT Deneme Sınavı" totalQuestions={120} data={tytData} breakdown={tytBreakdown} />
                  </div>
                </div>
                
                <div className="flex flex-col h-full">
                  <div className="flex justify-end mb-3 gap-2 shrink-0 h-[32px]">
                    <button onClick={() => setExamView('AYT')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center ${examView === 'AYT' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>AYT</button>
                    <button onClick={() => setExamView('YDT')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center ${examView === 'YDT' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>YDT (Dil)</button>
                  </div>
                  
                  {examView === 'AYT' ? (
                    lastAyt ? (
                      <div className="flex-1 flex flex-col">
                        <ExamCard title="AYT Performans Analizi" totalQuestions={80} data={aytData} breakdown={aytBreakdown} headerRight={aytHeaderRight} />
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center h-full flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Bu alana ait deneme verisi bulunamadı</h3>
                      </div>
                    )
                  ) : (
                    lastYdt ? (
                      <div className="flex-1 flex flex-col">
                        <ExamCard title="YDT (Dil) Performans Analizi" totalQuestions={80} data={ydtData} breakdown={ydtBreakdown} />
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center h-full flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Bu alana ait deneme verisi bulunamadı</h3>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Genel İlerleme Grafiği (Line Chart) */}
              <div className="mt-12 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Dönemsel Net İlerlemesi</h2>
                    <p className="text-sm text-slate-500 mt-1">Girdiğiniz denemelerin tarihsel olarak net (doğru-yanlış) gelişimi.</p>
                  </div>
                  
                  {/* Filtre ve Sekme Butonları */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0">
                      <button onClick={() => setExamTab("TYT")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${examTab === 'TYT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>TYT</button>
                      <button onClick={() => setExamTab("AYT")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${examTab === 'AYT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>AYT</button>
                      <button onClick={() => setExamTab("YDT")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${examTab === 'YDT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>YDT</button>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0">
                      <button onClick={() => setTimeFilter("all")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timeFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Tüm Dönem</button>
                      <button onClick={() => setTimeFilter("month")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timeFilter === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Aylık</button>
                    </div>
                  </div>
                </div>

                <div className="w-full h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                      <YAxis domain={[0, 120]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 600 }} />
                      <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: 500 }} />
                      <Line name={`${examTab} Neti`} type="monotone" dataKey="net" stroke={examTab === "TYT" ? "#3b82f6" : examTab === "AYT" ? "#8b5cf6" : "#f59e0b"} strokeWidth={4} dot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: examTab === "TYT" ? "#3b82f6" : examTab === "AYT" ? "#8b5cf6" : "#f59e0b" }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex-1 flex flex-col animate-fade-in min-h-[500px]">
          {/* Üst Bar: Filtreler ve Yeni Ekle Butonu */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto shrink-0">
                {["Tümü", "TYT", "AYT", "YDT"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setHistoryFilter(tab)}
                    className={`flex-1 sm:flex-none px-6 py-2 text-sm font-semibold rounded-lg transition-all ${historyFilter === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              <div className="text-sm font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                Görüntülenen: <strong className="text-slate-800 mx-1">{filteredHistory.length}</strong> Deneme
              </div>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm shadow-blue-600/20 w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
              Yeni Deneme Ekle
            </button>
          </div>

          {/* Jilet Hizalı 3 Sütunlu Liste */}
          <div className="flex-1 overflow-y-auto custom-calendar-scroll pr-2">
            {filteredHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <p>Bu kategoriye ait deneme bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map(exam => (
                  <div key={exam.id} className="bg-slate-50 rounded-2xl border border-slate-100/50 overflow-hidden transition-all duration-300 hover:shadow-sm">
                    <div className="flex justify-between items-center p-4">
                      <div className="flex-1 pr-4">
                        <h3 className="font-bold text-slate-800 truncate">{exam.examName}</h3>
                        <span className="inline-block px-2 py-0.5 mt-1.5 bg-slate-200/70 text-slate-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                          {exam.examType === 'YDT' ? 'YDT - DİL' : exam.examType}
                        </span>
                      </div>
                      
                      <div className="w-28 flex items-center text-sm font-medium text-slate-500 shrink-0">
                        <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {new Date(exam.createdAt).toLocaleDateString("tr-TR")}
                      </div>
                      
                      <div className="w-full sm:w-72 md:w-80 flex flex-wrap sm:flex-nowrap items-center justify-start sm:justify-end gap-2 mt-3 sm:mt-0 shrink-0">
                        {exam.examType === 'TYT' ? (
                          <div className="bg-blue-50 text-blue-700 border-blue-100 px-2.5 py-1 rounded-xl text-xs font-bold tracking-wide shadow-sm border">
                            TYT: {(Number(exam.totalNet) || 0).toFixed(2)} N
                          </div>
                        ) : exam.examType === 'YDT' ? (
                          <div className="bg-amber-50 text-amber-700 border-amber-100 px-2.5 py-1 rounded-xl text-xs font-bold tracking-wide shadow-sm border">
                            DİL: {((Number(exam.ydtLanguage) || 0)).toFixed(2)} N
                          </div>
                        ) : (
                          <>
                            <div className="bg-purple-50 text-purple-700 border-purple-100 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold tracking-wide shadow-sm border whitespace-nowrap">
                              SAY: {((Number(exam.aytMath) || 0) + (Number(exam.aytScience) || 0)).toFixed(2)} N
                            </div>
                            <div className="bg-pink-50 text-pink-700 border-pink-100 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold tracking-wide shadow-sm border whitespace-nowrap">
                              EA: {((Number(exam.aytMath) || 0) + (Number(exam.aytEdSos1) || 0)).toFixed(2)} N
                            </div>
                            <div className="bg-indigo-50 text-indigo-700 border-indigo-100 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold tracking-wide shadow-sm border whitespace-nowrap">
                              SÖZ: {((Number(exam.aytEdSos1) || 0) + (Number(exam.aytSocial2) || 0)).toFixed(2)} N
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => setExpandedExamId(expandedExamId === exam.id ? null : exam.id)} 
                          title="Sınavı İncele"
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${expandedExamId === exam.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                          İncele
                        </button>
                        <button 
                          onClick={() => handleDeleteExam(exam.id)} 
                          title="Sınavı Sil"
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </div>

                    {/* Accordion Detail Area */}
                    {expandedExamId === exam.id && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50/80 rounded-2xl mt-3 border border-slate-100">
                          {exam.examType === 'TYT' ? (
                            <>
                              {renderSubjectDetail("Türkçe", exam.tytTurkish)}
                              {renderSubjectDetail("Matematik", exam.tytMath)}
                              {renderSubjectDetail("Sosyal B.", exam.tytSocial)}
                              {renderSubjectDetail("Fen Bil.", exam.tytScience)}
                            </>
                          ) : exam.examType === 'YDT' ? (
                            <>
                              {renderSubjectDetail("Yabancı Dil (80 Soru)", exam.ydtLanguage)}
                            </>
                          ) : (
                            <>
                              {renderSubjectDetail("Matematik", exam.aytMath)}
                              {renderSubjectDetail("Fen Bil.", exam.aytScience)}
                              {renderSubjectDetail("Edebiyat-Sos1", exam.aytEdSos1)}
                              {renderSubjectDetail("Sosyal-2", exam.aytSocial2)}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Yeni Deneme Modal */}
      <ExamCreateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onExamCreated={fetchExams} 
      />
    </div>
  );
}
