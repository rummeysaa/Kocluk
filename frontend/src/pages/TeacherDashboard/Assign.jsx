import React, { useState, useEffect } from "react";

export default function AssignTasksPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("Hepsi");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/students", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Öğrenciler yüklenemedi", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedStudentIds.length === 0 || !formData.title || !formData.description) {
      setToast({ show: true, message: 'Görev atanamadı, lütfen alanları kontrol edin! ❌', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = new FormData();
      payload.append("studentIds", JSON.stringify(selectedStudentIds));
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      if (formData.dueDate) {
        payload.append("dueDate", formData.dueDate);
      }
      if (selectedFile) {
        payload.append("file", selectedFile);
      }

      const response = await fetch("http://localhost:5000/api/assignments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: payload
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Sunucu Hatası: ${response.status} ${response.statusText}`);
      }

      setToast({ show: true, message: 'Görev başarıyla atandı!', type: 'success' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);

      setFormData(prev => ({
        ...prev,
        title: "",
        description: "",
        dueDate: ""
      }));
      setSelectedFile(null);
      setSelectedStudentIds([]);
    } catch (err) {
      console.error("Hatanın Detayı:", err);
      setToast({ show: true, message: err.message || 'Görev atanamadı, lütfen alanları kontrol edin! ❌', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => (filterDept === 'Hepsi' || s.department === filterDept) && s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectAll = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedStudentIds.includes(id));
    
    if (allSelected) {
      setSelectedStudentIds(selectedStudentIds.filter(id => !filteredIds.includes(id)));
    } else {
      const newIds = new Set([...selectedStudentIds, ...filteredIds]);
      setSelectedStudentIds(Array.from(newIds));
    }
  };

  const toggleStudentSelection = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(sId => sId !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  return (
    <div className="w-full">
      {/* Dinamik Toast Bildirimi */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl shadow-lg border font-medium flex items-center gap-2 transition-all ${
          toast.type === 'success' 
            ? 'bg-emerald-500 text-white shadow-emerald-200 border-emerald-600' 
            : 'bg-rose-500 text-white shadow-rose-200 border-rose-600'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          )}
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-800 mb-2">Öğrenciye Görev Tanımla</h1>
      <p className="text-slate-500 mb-8">Öğrencilerinize günlük, haftalık veya aylık periyotlarla çalışma görevleri atayın.</p>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:items-stretch">
        
        {/* SOL SÜTUN: Öğrenci Seçim Alanı (Kelepçeli Alan) */}
        <div className="lg:col-span-4 h-full relative">
          <div className="lg:absolute lg:inset-0 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col space-y-4">
            
            {/* Alan Filtresi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Alan Filtresi</label>
              <div className="flex flex-wrap gap-2">
                {['Hepsi', 'SAY', 'EA', 'SÖZ', 'DİL'].map(dept => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setFilterDept(dept)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterDept === dept ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Arama */}
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text"
                placeholder="İsimle ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Öğrenci Listesi (İç İçe Scrollbar Mekanizması) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b border-slate-200 shrink-0">
                <span className="text-xs font-medium text-slate-600">Öğrenciler ({filteredStudents.length})</span>
                <button 
                  type="button" 
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  Tümünü Seç
                </button>
              </div>
              <div className="p-2 space-y-1 overflow-y-auto flex-1">
                {loading ? (
                  <p className="text-sm text-slate-500 p-4 text-center">Yükleniyor...</p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-sm text-slate-500 p-4 text-center">Öğrenci bulunamadı.</p>
                ) : (
                  filteredStudents.map(student => (
                    <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition">
                      <input 
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 font-medium">{student.name}</span>
                      {student.department && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-auto">{student.department}</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* SAĞ SÜTUN: Görev Detay Alanı (Sabit Yükseklik ve Scroll) */}
        <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[650px]">
          
          {/* Seçilen Rozetler - Taşarsa Scroll olacak */}
          <div className="mb-6 shrink-0">
            <label className="block text-sm font-medium text-slate-700 mb-2">Seçilen Öğrenciler ({selectedStudentIds.length})</label>
            <div className="flex flex-wrap gap-2 min-h-[44px] max-h-[100px] overflow-y-auto p-3 border border-slate-200 bg-slate-50 rounded-xl items-center">
              {selectedStudentIds.length === 0 ? (
                <span className="text-sm text-slate-400 font-medium">Sol menüden öğrenci seçin...</span>
              ) : (
                selectedStudentIds.map(id => {
                  const s = students.find(x => x.id === id);
                  if (!s) return null;
                  return (
                    <div key={id} className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-blue-200 shrink-0">
                      {s.name}
                      <button type="button" onClick={() => toggleStudentSelection(id)} className="text-blue-500 hover:text-blue-700 focus:outline-none">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="space-y-6 flex-1 flex flex-col min-h-0">
            <div className="shrink-0">
              <label className="block text-sm font-medium text-slate-700 mb-2">Görev Başlığı</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Örn: TYT Matematik - Üslü Sayılar 50 Soru" 
                className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Görev Detayı - Kendi içinde flex-1 ile uzayıp scroll olacak */}
            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-sm font-medium text-slate-700 mb-2 shrink-0">Görev Detayı (Açıklama)</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ödevin detaylarını buraya yazın..." 
                className="w-full flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none overflow-y-auto"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Son Teslim Tarihi</label>
                <input 
                  type="date" 
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dosya/Eklenti Seç (İsteğe Bağlı)</label>
                <div className="flex items-center gap-3 w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-colors">
                  <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  <input 
                    type="file" 
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full text-sm text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 shrink-0 flex justify-end border-t border-slate-100">
              <button 
                type="submit" 
                disabled={submitting || selectedStudentIds.length === 0}
                className={`w-full md:w-auto font-medium rounded-xl px-8 py-4 transition shadow-sm flex justify-center items-center gap-2 ${submitting || selectedStudentIds.length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#2563EB] text-white hover:bg-blue-700'}`}
              >
                {submitting ? 'Gönderiliyor...' : `Görevi Seçilen ${selectedStudentIds.length} Öğrenciye Gönder`}
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
