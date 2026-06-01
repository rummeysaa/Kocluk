"use client";
import React, { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 text-xs font-semibold text-slate-800 space-y-1">
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || item.stroke }}></div>
            <span>{item.name}: {item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("Öğrenci");
  const [tasks, setTasks] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [latestExam, setLatestExam] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          router.push("/");
          return;
        }

        const user = JSON.parse(userStr);
        setStudentName(user.name);

        const response = await fetch(`http://localhost:5000/api/student/dashboard-data?studentId=${user.id}`);
        if (!response.ok) {
          throw new Error("Veriler yüklenirken bir sorun oluştu.");
        }

        const data = await response.json();
        setTasks(data.tasks || []);
        setChartData(data.chartData || []);
        setLatestExam(data.latestExam || null);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleToggleTask = async (taskId) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      // Optimistically update the UI tasks state
      const updatedTasks = tasks.map((t) => {
        if (t.id === taskId) {
          const newChecked = !t.checked;
          return {
            ...t,
            checked: newChecked,
            status: newChecked ? "Tamamlandı" : "Bekliyor",
          };
        }
        return t;
      });
      setTasks(updatedTasks);

      // Send to server
      const response = await fetch("http://localhost:5000/api/student/toggle-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: user.id,
          assignmentId: taskId,
        }),
      });

      if (!response.ok) {
        throw new Error("Durum güncellenirken sunucu hatası oluştu.");
      }

      // Fetch the fresh database-backed data to align both tasks and chart
      const res = await fetch(`http://localhost:5000/api/student/dashboard-data?studentId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setChartData(data.chartData || []);
      }

    } catch (err) {
      console.error(err);
      // Re-fetch to restore consistency on error
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const res = await fetch(`http://localhost:5000/api/student/dashboard-data?studentId=${user.id}`);
        const data = await res.json();
        setTasks(data.tasks || []);
        setChartData(data.chartData || []);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Calculate Success Percentage
  const successPercentage = latestExam 
    ? Math.round((latestExam.totalCorrect / (latestExam.totalCorrect + latestExam.totalWrong + latestExam.totalBlank)) * 100)
    : 86; // Default placeholder success percentage

  return (
    <>
      {/* Karşılama */}
      <div className="text-center md:text-left space-y-2 py-2">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Hoş geldin {studentName}!</h1>
        <p className="text-slate-500 italic text-sm md:text-base">Bugün yapacağın küçük adımlar, yarınki büyük başarıların temelidir.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Orta İki Kolon: Görevler ve Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Görevler Kartı */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[280px]">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-6">Bugünkü Görevlerim</h2>
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-slate-400 text-sm py-4 text-center">
                  Henüz atanmış bir görev bulunmamaktadır.
                </div>
              ) : (
                tasks.slice(0, 3).map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => handleToggleTask(task.id)}
                    className="flex items-center justify-between group cursor-pointer hover:bg-slate-50/50 p-2 -mx-2 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${task.checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {task.checked && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                      </div>
                      <span className={`text-sm md:text-base font-medium ${task.checked ? 'text-slate-700' : 'text-slate-500'}`}>{task.title}</span>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${task.checked ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {tasks.length > 3 && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-right">
              <Link 
                href="/dashboard/daily" 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 transition-colors"
              >
                Tümünü Gör ({tasks.length})
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* İlerleme Grafiği Kartı */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Haftalık İlerleme</h2>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-semibold text-slate-600">Tamamlanan Görevler</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
              <span className="text-xs font-semibold text-slate-600">Toplam Görevler</span>
            </div>
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} interval={0} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="current" name="Tamamlanan" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="planned" name="Toplam" stroke="#93c5fd" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </>
  );
}
