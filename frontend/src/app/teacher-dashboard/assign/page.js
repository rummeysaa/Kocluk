"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssignTasksPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Form fields
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  
  const router = useRouter();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          router.push("/");
          return;
        }

        const user = JSON.parse(userStr);
        if (user.role !== "TEACHER") {
          router.push("/dashboard");
          return;
        }

        const response = await fetch("http://localhost:5000/api/teacher/students");
        if (!response.ok) {
          throw new Error("Öğrenciler yüklenirken bir sorun oluştu.");
        }

        const data = await response.json();
        setStudents(data || []);
        if (data.length > 0) {
          setStudentId(data[0].id);
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !title || !dueDate) {
      setMessage({ type: "error", text: "Lütfen öğrenciyi, görev başlığını ve son teslim tarihini doldurun." });
      return;
    }

    setSubmitLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const userStr = localStorage.getItem("user");
      const user = JSON.parse(userStr);

      const response = await fetch("http://localhost:5000/api/teacher/assign-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: user.id,
          studentId: Number(studentId),
          title,
          description,
          dueDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Görev atanırken bir sorun oluştu.");
      }

      setMessage({ type: "success", text: "Görev başarıyla atandı!" });
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Öğrenciler Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Öğrenciye Görev Ver</h1>
      <p className="text-slate-500 mb-8">Öğrencilerinize ders çalışma ve deneme sınavı hedefleri atayın.</p>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
            : "bg-red-50 text-red-600 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Öğrenci Seçin</label>
          <select 
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {students.length === 0 ? (
              <option value="">Kayıtlı öğrenci bulunamadı</option>
            ) : (
              students.map(student => (
                <option key={student.id} value={student.id}>{student.name} ({student.email})</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Görev Başlığı</label>
          <input 
            type="text" 
            placeholder="Örn: TYT Matematik - Üslü Sayılar 50 Soru" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Açıklama / Notlar</label>
          <textarea 
            placeholder="Görevle ilgili ek notlar veya açıklamalar..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Son Teslim Tarihi</label>
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Öncelik</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option>Normal</option>
              <option>Yüksek</option>
              <option>Düşük</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={submitLoading || students.length === 0}
          className="bg-blue-600 text-white font-bold rounded-xl px-6 py-3 hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitLoading ? "Görev Atanıyor..." : "Görevi Ata"}
        </button>
      </form>
    </div>
  );
}
