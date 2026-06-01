"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DailyTasksPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          router.push("/");
          return;
        }

        const user = JSON.parse(userStr);
        const response = await fetch(`http://localhost:5000/api/student/dashboard-data?studentId=${user.id}`);
        if (!response.ok) {
          throw new Error("Görevler yüklenirken bir sorun oluştu.");
        }

        const data = await response.json();
        setTasks(data.tasks || []);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
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

      // Fetch the fresh database-backed data to align tasks
      const res = await fetch(`http://localhost:5000/api/student/dashboard-data?studentId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }

    } catch (err) {
      console.error(err);
      // Re-fetch on error to restore consistency
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const res = await fetch(`http://localhost:5000/api/student/dashboard-data?studentId=${user.id}`);
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Görevler Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.checked).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 transition shadow-sm text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Günlük Görevlerim</h1>
          <p className="text-sm text-slate-500 mt-0.5">Bugün tamamlamanız gereken tüm hedefler ve çalışmalar.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Progress Card */}
      {totalTasks > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Günün İlerleme Durumu</h3>
              <p className="text-xs text-slate-400 mt-0.5">{totalTasks} görevden {completedTasks} tanesi tamamlandı.</p>
            </div>
            <span className="text-2xl font-black text-blue-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col justify-between">
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-slate-400 text-sm py-12 text-center">
              Bugün için planlanmış bir göreviniz bulunmuyor.
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => handleToggleTask(task.id)}
                className="flex items-center justify-between group cursor-pointer hover:bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-all hover:scale-[1.005] duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${task.checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                    {task.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                  </div>
                  <span className={`text-base font-semibold transition-all ${task.checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {task.title}
                  </span>
                </div>
                <span className={`text-xs px-3.5 py-1.5 rounded-full font-bold uppercase ${task.checked ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                  {task.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
