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

export default function StudentAnalyticsPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examsLoading, setExamsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);

        const response = await fetch(`http://localhost:5000/api/teacher/my-students?teacherId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          // Filter to only approved / registered students with real IDs
          const activeStudents = (data || []).filter(s => s.id !== null && s.status === "APPROVED");
          setStudents(activeStudents);
          if (activeStudents.length > 0) {
            setSelectedStudentId(activeStudents[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchStudentExams = async () => {
      try {
        setExamsLoading(true);
        const res = await fetch(`http://localhost:5000/api/student/practice-exams?studentId=${selectedStudentId}`);
        if (res.ok) {
          const data = await res.json();
          setExams(data || []);
        }
      } catch (err) {
        console.error("Error fetching student exams:", err);
      } finally {
        setExamsLoading(false);
      }
    };

    fetchStudentExams();
  }, [selectedStudentId]);

  const getSelectedStudentName = () => {
    const student = students.find(s => s.id === Number(selectedStudentId));
    return student ? student.name : "Öğrenci";
  };

  const getTrendData = () => {
    const sorted = [...exams].sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
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

  const trendDataMapped = getTrendData();

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Öğrenci Listesi Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-12">
      
      {/* Üst Kısım ve Öğrenci Seçici */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Öğrenci Analizleri</h1>
          <p className="text-slate-500 mt-2">Öğrencilerinizin deneme performanslarını ve detaylı analizlerini inceleyin.</p>
        </div>
        
        {students.length > 0 && (
          <div className="flex flex-col gap-1.5 shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Öğrenci Seçin</label>
            <select 
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#2563EB] text-sm font-bold text-[#2563EB] cursor-pointer min-w-[200px]"
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-xl mx-auto shadow-sm my-10">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Aktif Öğrenci Bulunmamaktadır</h2>
          <p className="text-slate-500">Deneme analizi yapabilmek için öncelikle anasayfadan öğrenci davet etmeniz ve öğrencinin kaydolması gerekmektedir.</p>
        </div>
      ) : examsLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-xl mx-auto shadow-sm my-10">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Deneme Sınavı Sonucu Yok</h2>
          <p className="text-slate-500">Seçilen öğrenci ({getSelectedStudentName()}) henüz bir deneme sınavı kaydetmemiştir.</p>
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
              <h2 className="text-xl font-bold text-slate-800">{getSelectedStudentName()} - Dönemsel Net İlerlemesi</h2>
              <p className="text-sm text-slate-500 mt-1">Öğrencinin girdiği denemelerin tarihsel olarak net gelişimi.</p>
            </div>

            {/* Çizgi Grafiği */}
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendDataMapped} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
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
    </div>
  );
}
