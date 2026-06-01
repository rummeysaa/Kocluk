import React, { useState, useEffect, useMemo } from "react";

// Alanı olmayan öğrencilere UI filtresi testi için mock atama
const getDepartment = (student, index) => {
  if (student.department) return student.department;
  const depts = ['SAY', 'EA', 'SÖZ', 'DİL'];
  return depts[index % 4];
};

// Net üzerinden Doğru ve Yanlış sayılarını tersine mühendislikle bulan helper
const calculateDY = (netValue) => {
  if (netValue === null || netValue === undefined || isNaN(netValue)) return { d: '-', y: '-', n: '-' };
  if (netValue === 0) return { d: 0, y: 0, n: 0 };
  if (netValue < 0) return { d: 0, y: Math.round(Math.abs(netValue) * 4), n: netValue };
  
  const d = Math.ceil(netValue);
  const y = Math.round((d - netValue) * 4);
  return { d, y, n: netValue };
};

export default function StudentAnalyticsPage() {
  const [students, setStudents] = useState([]);
  const [activeStudentId, setActiveStudentId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("ALL");
  const [activeExamFilter, setActiveExamFilter] = useState("ALL"); // ALL, TYT, AYT, YDT
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/students", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((s, idx) => ({
            ...s,
            displayDepartment: getDepartment(s, idx)
          }));
          setStudents(mapped);
          if (mapped.length > 0) setActiveStudentId(mapped[0].id.toString());
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("API hatası:", err);
        setError("Öğrenciler yüklenemedi.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!activeStudentId) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5000/api/exams/student/${activeStudentId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setExams(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("API hatası:", err);
        setError("Sınav verileri yüklenemedi.");
        setLoading(false);
      });
  }, [activeStudentId]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = activeDepartment === "ALL" || s.displayDepartment === activeDepartment;
      return matchSearch && matchDept;
    });
  }, [students, searchQuery, activeDepartment]);

  const activeStudent = students.find(s => s.id.toString() === activeStudentId?.toString());
  
  // Sınavları tarihe göre tersten sırala
  const sortedExams = [...exams].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Görünürlük Bayrakları
  const showTYT = activeExamFilter === "ALL" || activeExamFilter === "TYT";
  const showAYT = activeExamFilter === "ALL" || activeExamFilter === "AYT";
  const showYDT = activeExamFilter === "ALL" || activeExamFilter === "YDT";

  if (loading && students.length === 0) {
    return <div className="p-8 text-center text-slate-500 font-medium">Veriler yükleniyor...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
  }

  // D|Y|N hücrelerini render eden minik bir fonksiyon
  const renderDynCells = (netValue) => {
    const { d, y, n } = calculateDY(netValue);
    return (
      <>
        <td className="px-2 py-3 border-r border-slate-100 text-center text-slate-600">{d}</td>
        <td className="px-2 py-3 border-r border-slate-100 text-center text-slate-500">{y}</td>
        <td className="px-2 py-3 border-r border-slate-200 text-center font-bold text-indigo-700 bg-indigo-50/30">{n !== '-' ? Number(n).toFixed(2) : '-'}</td>
      </>
    );
  };

  return (
    <div className="min-h-full pb-12 flex flex-col gap-6">
      
      {/* 1. Üst Filtreleme Kontrolleri */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Öğrenci Arama */}
          <div className="relative w-full lg:max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Öğrenci ismine göre ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Alan Filtresi */}
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
              {["ALL", "SAY", "EA", "SÖZ", "DİL"].map(filter => (
                <button key={filter} onClick={() => setActiveDepartment(filter)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeDepartment === filter ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {filter === "ALL" ? "Tüm Alanlar" : filter}
                </button>
              ))}
            </div>

            {/* Sınav Türü Filtresi */}
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
              {["ALL", "TYT", "AYT", "YDT"].map(filter => (
                <button key={filter} onClick={() => setActiveExamFilter(filter)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeExamFilter === filter ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {filter === "ALL" ? "Tüm Sınavlar" : filter}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* 2. Sol Sütun (Öğrenciler) */}
        <div className="w-full lg:w-1/4 xl:w-1/5 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[75vh]">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Öğrenci Listesi</h2>
            <p className="text-xs text-slate-500 mt-1">{filteredStudents.length} öğrenci bulundu</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredStudents.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">Öğrenci bulunamadı.</p>
            ) : (
              filteredStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => setActiveStudentId(student.id.toString())}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    activeStudentId === student.id.toString() ? "bg-indigo-50 border-indigo-100 shadow-sm ring-1 ring-indigo-500/20" : "hover:bg-slate-50 border-transparent"
                  } border`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${activeStudentId === student.id.toString() ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                      {student.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className={`text-sm font-bold truncate ${activeStudentId === student.id.toString() ? "text-indigo-900" : "text-slate-800"}`}>{student.name}</h3>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ml-2 ${activeStudentId === student.id.toString() ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-500"}`}>
                    {student.displayDepartment}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 3. Sağ Ana Panel - 3 Katmanlı Deneme Matrisi */}
        <div className="w-full lg:w-3/4 xl:w-4/5 flex flex-col gap-6">
          {activeStudent ? (
            <>
              {/* Matris Tablosu */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 h-[55vh]">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Detaylı Performans Karnesi</h2>
                    <p className="text-sm text-slate-500"><span className="font-semibold text-slate-700">{activeStudent.name}</span> isimli öğrencinin sınav analizi</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-slate-200">
                  <table className="w-full text-left text-[13px] border-collapse min-w-max">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 border-b-2 border-slate-200">
                      
                      {/* Katman 1: Sınav Grupları */}
                      <tr>
                        <th rowSpan={3} className="px-4 py-2 border-r border-slate-200 font-bold bg-slate-100/80 align-middle">Tarih</th>
                        <th rowSpan={3} className="px-4 py-2 border-r border-slate-200 font-bold bg-slate-100/80 align-middle min-w-[150px]">Sınav Adı</th>
                        {showTYT && <th colSpan={12} className="px-4 py-2 border-r border-slate-200 font-black text-center bg-blue-50 text-blue-800">TYT BÖLÜMÜ</th>}
                        {showAYT && <th colSpan={12} className="px-4 py-2 border-r border-slate-200 font-black text-center bg-purple-50 text-purple-800">AYT BÖLÜMÜ</th>}
                        {showYDT && <th colSpan={3} className="px-4 py-2 border-r border-slate-200 font-black text-center bg-emerald-50 text-emerald-800">YDT BÖLÜMÜ</th>}
                        <th rowSpan={3} className="px-4 py-2 font-black text-center bg-indigo-100 text-indigo-900 align-middle shadow-inner">TOPLAM NET</th>
                      </tr>

                      {/* Katman 2: Ders İsimleri */}
                      <tr className="text-xs uppercase tracking-wider bg-slate-50">
                        {showTYT && (
                          <>
                            <th colSpan={3} className="px-2 py-2 border-r border-slate-200 text-center font-bold text-blue-900 bg-blue-50/50">Türkçe</th>
                            <th colSpan={3} className="px-2 py-2 border-r border-slate-200 text-center font-bold text-blue-900 bg-blue-50/50">Sosyal</th>
                            <th colSpan={3} className="px-2 py-2 border-r border-slate-200 text-center font-bold text-blue-900 bg-blue-50/50">Matematik</th>
                            <th colSpan={3} className="px-2 py-2 border-r border-slate-200 text-center font-bold text-blue-900 bg-blue-50/50">Fen</th>
                          </>
                        )}
                        {showAYT && (
                          <>
                            <th colSpan={3} className="px-2 py-2 border-r border-slate-200 text-center font-bold text-purple-900 bg-purple-50/50">Matematik</th>
                            <th colSpan={3} className="px-2 py-2 border-r border-slate-200 text-center font-bold text-purple-900 bg-purple-50/50">Fen</th>
                            <th colSpan={3} className="px-2 py-2 border-r border-slate-200 text-center font-bold text-purple-900 bg-purple-50/50">Ed/Sos-1</th>
                            <th colSpan={3} className="px-2 py-2 border-r border-slate-200 text-center font-bold text-purple-900 bg-purple-50/50">Sosyal-2</th>
                          </>
                        )}
                        {showYDT && <th colSpan={3} className="px-2 py-2 border-r border-slate-200 text-center font-bold text-emerald-900 bg-emerald-50/50">Yabancı Dil</th>}
                      </tr>

                      {/* Katman 3: D / Y / N Kırılımı */}
                      <tr className="text-[11px] font-black bg-white shadow-sm">
                        {showTYT && Array.from({length: 4}).map((_, i) => (
                          <React.Fragment key={`tyt-dyn-${i}`}>
                            <th className="px-1 py-1.5 border-r border-slate-100 text-center text-emerald-600 bg-emerald-50/30">D</th>
                            <th className="px-1 py-1.5 border-r border-slate-100 text-center text-rose-600 bg-rose-50/30">Y</th>
                            <th className="px-1 py-1.5 border-r border-slate-200 text-center text-indigo-600 bg-indigo-50/30">N</th>
                          </React.Fragment>
                        ))}
                        {showAYT && Array.from({length: 4}).map((_, i) => (
                          <React.Fragment key={`ayt-dyn-${i}`}>
                            <th className="px-1 py-1.5 border-r border-slate-100 text-center text-emerald-600 bg-emerald-50/30">D</th>
                            <th className="px-1 py-1.5 border-r border-slate-100 text-center text-rose-600 bg-rose-50/30">Y</th>
                            <th className="px-1 py-1.5 border-r border-slate-200 text-center text-indigo-600 bg-indigo-50/30">N</th>
                          </React.Fragment>
                        ))}
                        {showYDT && (
                          <>
                            <th className="px-1 py-1.5 border-r border-slate-100 text-center text-emerald-600 bg-emerald-50/30">D</th>
                            <th className="px-1 py-1.5 border-r border-slate-100 text-center text-rose-600 bg-rose-50/30">Y</th>
                            <th className="px-1 py-1.5 border-r border-slate-200 text-center text-indigo-600 bg-indigo-50/30">N</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedExams.length === 0 ? (
                        <tr>
                          <td colSpan={100} className="px-6 py-12 text-center text-slate-400">Öğrenciye ait deneme bulunamadı.</td>
                        </tr>
                      ) : (
                        sortedExams.map(exam => {
                          const isTYT = exam.examType === 'TYT';
                          const isAYT = exam.examType === 'AYT';
                          const isYDT = exam.examType === 'YDT';

                          return (
                            <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 border-r border-slate-100 font-medium text-slate-700 whitespace-nowrap">
                                {new Date(exam.createdAt).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-4 py-3 border-r border-slate-200">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider mr-2 ${
                                  isTYT ? 'bg-blue-100 text-blue-700' : isAYT ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {exam.examType}
                                </span>
                                <span className="text-slate-600 font-semibold truncate max-w-[120px]" title={exam.examName}>{exam.examName}</span>
                              </td>
                              
                              {/* TYT Hücreleri */}
                              {showTYT && (
                                <>
                                  {renderDynCells(isTYT ? exam.tytTurkish : null)}
                                  {renderDynCells(isTYT ? exam.tytSocial : null)}
                                  {renderDynCells(isTYT ? exam.tytMath : null)}
                                  {renderDynCells(isTYT ? exam.tytScience : null)}
                                </>
                              )}

                              {/* AYT Hücreleri */}
                              {showAYT && (
                                <>
                                  {renderDynCells(isAYT ? exam.aytMath : null)}
                                  {renderDynCells(isAYT ? exam.aytScience : null)}
                                  {renderDynCells(isAYT ? exam.aytEdSos1 : null)}
                                  {renderDynCells(isAYT ? exam.aytSocial2 : null)}
                                </>
                              )}

                              {/* YDT Hücreleri */}
                              {showYDT && renderDynCells(isYDT ? exam.ydtLanguage : null)}

                              {/* Toplam Net */}
                              <td className="px-4 py-3 font-black text-center text-indigo-700 bg-indigo-50/50">
                                {exam.totalNet.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Öğrenci Seçilmedi</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Detaylı karne matrisini görüntülemek için sol listeden bir öğrenci seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
