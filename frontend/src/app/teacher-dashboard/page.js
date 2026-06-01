"use client";
import React, { useState, useEffect } from "react";

export default function TeacherDashboardHome() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeStudents: 0,
    pendingInvites: 0,
    completedTasks: 0
  });
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, APPROVED, PENDING
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  
  // Add student form state
  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: ""
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Submissions evaluation state
  const [evalNotes, setEvalNotes] = useState({}); // { submissionId: "note text" }
  const [evalSuccessId, setEvalSuccessId] = useState(null);

  const loadData = async (teacherId) => {
    try {
      // Fetch stats
      const statsRes = await fetch(`http://localhost:5000/api/teacher/stats?teacherId=${teacherId}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch students list
      const studentsRes = await fetch(`http://localhost:5000/api/teacher/my-students?teacherId=${teacherId}`);
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      // Fetch completed submissions
      const submissionsRes = await fetch(`http://localhost:5000/api/teacher/submissions?teacherId=${teacherId}`);
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData);
        
        // Initialize evaluation notes
        const initialNotes = {};
        submissionsData.forEach(sub => {
          initialNotes[sub.id] = sub.teacherNote || "";
        });
        setEvalNotes(initialNotes);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      loadData(parsedUser.id);
    }
  }, []);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    if (!formData.studentName.trim() || !formData.studentEmail.trim()) {
      setFormError("Lütfen tüm alanları doldurun.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/teacher/invite-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          teacherId: user.id,
          studentEmail: formData.studentEmail,
          studentName: formData.studentName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Öğrenci davet edilirken hata oluştu.");
      }

      setFormSuccess(`Davet e-postası başarıyla gönderildi! Atanan Öğrenci Numarası: ${data.relationship.studentNumber}`);
      setFormData({ studentName: "", studentEmail: "" });
      
      // Reload dashboard data
      if (user) {
        loadData(user.id);
      }

      // Close modal after delay
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess("");
      }, 2500);

    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Evaluate a specific submission
  const handleSaveEvaluation = async (submissionId) => {
    const noteText = evalNotes[submissionId] || "";
    try {
      const response = await fetch("http://localhost:5000/api/teacher/evaluate-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          submissionId,
          teacherNote: noteText
        })
      });

      if (response.ok) {
        setEvalSuccessId(submissionId);
        setTimeout(() => setEvalSuccessId(null), 2000);
        // Refresh data
        if (user) {
          loadData(user.id);
        }
      }
    } catch (err) {
      console.error("Error saving evaluation:", err);
    }
  };

  // Filter students list
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "ALL" || 
      student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Üst Karşılama ve Başlık */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Öğretmen Ana Sayfası</h1>
          <p className="text-slate-500 text-sm mt-1">
            Öğrencilerinizin genel durumunu, davetleri ve atanan görevlerin tamamlanma durumlarını buradan yönetebilirsiniz.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-md transition-all hover:scale-[1.02] active:scale-95 text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
          </svg>
          Yeni Öğrenci Ekle
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Aktif Öğrenciler Kartı */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full transition-all group-hover:scale-110"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Bağlı Öğrenciler
              </span>
              <p className="text-4xl font-extrabold text-slate-800 mt-4">{stats.activeStudents}</p>
              <p className="text-xs text-slate-400 mt-1">Aktif olarak koçluk yaptığınız öğrenciler</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
            <button 
              onClick={() => {
                setStatusFilter("APPROVED");
                const element = document.getElementById("students-list-section");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
            >
              Aktif Öğrencileri Gör &rarr;
            </button>
          </div>
        </div>

        {/* Bekleyen Davetler Kartı */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full transition-all group-hover:scale-110"></div>
          <div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Kayıt Bekleyenler
            </span>
            <p className="text-4xl font-extrabold text-slate-800 mt-4">{stats.pendingInvites}</p>
            <p className="text-xs text-slate-400 mt-1">Davet edilmiş fakat henüz kaydolmamış öğrenciler</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
            <button 
              onClick={() => {
                setStatusFilter("PENDING");
                const element = document.getElementById("students-list-section");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline transition-all"
            >
              Davetleri Gör &rarr;
            </button>
          </div>
        </div>

        {/* Bekleyen Değerlendirmeler Kartı (Interactive) */}
        <div 
          onClick={() => setShowEvalModal(true)}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden transition-all hover:shadow-md cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-all group-hover:scale-110"></div>
          <div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Bekleyen Değerlendirmeler
            </span>
            <p className="text-4xl font-extrabold text-slate-800 mt-4">{stats.completedTasks}</p>
            <p className="text-xs text-slate-400 mt-1">Öğrencilerinizin incelemenizi bekleyen tamamlanmış görevleri</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-600 group-hover:underline">
              Görevleri Gör & Değerlendir &rarr;
            </span>
          </div>
        </div>

      </div>

      {/* Öğrenci Listesi Bölümü */}
      <div id="students-list-section" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Bütün Öğrencileri Gör ({filteredStudents.length})</h2>
            <p className="text-slate-400 text-xs mt-0.5">Sistemdeki tüm kayıtlı ve davet edilmiş öğrencilerin listesi</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </span>
              <input
                type="text"
                placeholder="İsim, e-posta veya no ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
              />
            </div>

            {/* Status Filter buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "ALL" ? "bg-white text-slate-800 shadow-sm" : "hover:text-slate-800"}`}
              >
                Tümü
              </button>
              <button
                onClick={() => setStatusFilter("APPROVED")}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "APPROVED" ? "bg-white text-slate-800 shadow-sm" : "hover:text-slate-800"}`}
              >
                Aktifler
              </button>
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "PENDING" ? "bg-white text-slate-800 shadow-sm" : "hover:text-slate-800"}`}
              >
                Bekleyenler
              </button>
            </div>
          </div>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto border border-slate-50 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Öğrenci Numarası</th>
                <th className="py-4 px-6">Adı Soyadı</th>
                <th className="py-4 px-6">E-posta</th>
                <th className="py-4 px-6 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400 font-medium">
                    Aranan kriterlere uygun öğrenci bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.studentNumber} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-blue-600">
                      {student.studentNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {student.name}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">
                      {student.email}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border ${
                        student.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {student.status === "APPROVED" ? "Aktif / Kayıtlı" : "Kayıt Bekleniyor"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Öğrenci Ekle / Davet Et Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 transform scale-100 transition-all">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Yeni Öğrenci Davet Et</h3>
                <p className="text-slate-400 text-xs mt-0.5">Sisteme davet göndererek öğrencinizle bağ kurun.</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormError("");
                  setFormSuccess("");
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-semibold border border-red-100">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-xs font-semibold border border-green-100">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn. Caner Yıldız"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={formData.studentEmail}
                  onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Öğrenci Numarası
                </label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-500 font-mono font-semibold">
                  OG-XXXXX (Sistem tarafından otomatik üretilecektir)
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || formSuccess}
                  className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:bg-blue-400"
                >
                  {submitting ? "Davet Gönderiliyor..." : "E-postayı Gönder & Davet Et"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 19.5L21 12L3 4.5V9l12 3-12 3v4.5z"></path>
                  </svg>
                </button>
              </div>
            </form>

            <div className="bg-blue-50 border border-blue-100/50 p-4 rounded-2xl">
              <p className="text-[11px] text-blue-700 leading-normal">
                💡 <strong>Not:</strong> Öğrenci, bu e-posta adresi ile sisteme kaydolduğu an sizinle otomatik olarak eşleşecek ve koçluk bağı kurulacaktır.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Bekleyen Değerlendirmeler Modal */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 transform scale-100 transition-all max-h-[85vh] flex flex-col">
            
            <div className="flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-sans">Bekleyen Değerlendirmeler</h3>
                <p className="text-slate-400 text-xs mt-0.5">Öğrencilerinizin teslim ettiği görevleri inceleyin ve değerlendirme notları ekleyin.</p>
              </div>
              <button
                onClick={() => setShowEvalModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Submissions List Table */}
            <div className="overflow-y-auto flex-1 border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 sticky top-0">
                    <th className="py-3 px-4">Öğrenci</th>
                    <th className="py-3 px-4">Görev</th>
                    <th className="py-3 px-4">Tamamlanma Tarihi</th>
                    <th className="py-3 px-4">Değerlendirme Notu</th>
                    <th className="py-3 px-4 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                        Değerlendirme bekleyen tamamlanmış görev bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {sub.student.name}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-600">
                          {sub.assignment.title}
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[11px]">
                          {new Date(sub.submittedAt).toLocaleString("tr-TR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-4 min-w-[200px]">
                          <input
                            type="text"
                            placeholder="Değerlendirme notu yazın..."
                            value={evalNotes[sub.id] || ""}
                            onChange={(e) => setEvalNotes({ ...evalNotes, [sub.id]: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </td>
                        <td className="py-2 px-4 text-center shrink-0">
                          <button
                            onClick={() => handleSaveEvaluation(sub.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center mx-auto min-w-[80px]"
                          >
                            {evalSuccessId === sub.id ? (
                              <span className="text-emerald-300 font-bold flex items-center gap-1">
                                ✓ Kaydedildi
                              </span>
                            ) : (
                              "Kaydet"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 shrink-0">
              <button
                onClick={() => setShowEvalModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
