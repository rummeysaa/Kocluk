"use client";
import React, { useState } from "react";

export default function PlannedTasksPage() {
  const [viewMode, setViewMode] = useState("weekly");

  // Haftalık Plan verilerini state içine alıyoruz
  const [weeklyPlanData, setWeeklyPlanData] = useState([
    {
      day: "Pazartesi",
      date: "01 Haziran",
      tasks: [
        { id: 1, title: "Matematik - Fonksiyonlar Soru Çözümü (50 Soru)", duration: "60 dk", status: "completed" },
        { id: 2, title: "Türkçe - Paragrafta Anlam Çalışması", duration: "45 dk", status: "completed" }
      ]
    },
    {
      day: "Salı",
      date: "02 Haziran",
      tasks: [
        { id: 3, title: "Fizik - Elektrik ve Manyetizma Tekrarı", duration: "90 dk", status: "pending" },
        { id: 4, title: "Tarih - Atatürk İlkeleri Okuması", duration: "30 dk", status: "pending" }
      ]
    },
    {
      day: "Çarşamba",
      date: "03 Haziran",
      tasks: [
        { id: 5, title: "Kimya - Gazlar Konu Anlatım Dinleme", duration: "60 dk", status: "pending" },
        { id: 6, title: "Coğrafya - Harita Bilgisi Soru Çözümü", duration: "40 dk", status: "pending" }
      ]
    },
    {
      day: "Perşembe",
      date: "04 Haziran",
      tasks: [
        { id: 7, title: "Matematik - Trigonometri Giriş", duration: "75 dk", status: "pending" },
        { id: 8, title: "Felsefe - Bilgi Felsefesi Okuması", duration: "30 dk", status: "pending" }
      ]
    },
    {
      day: "Cuma",
      date: "05 Haziran",
      tasks: [
        { id: 9, title: "Biyoloji - Kalıtım ve Evrim Tekrarı", duration: "80 dk", status: "pending" },
        { id: 10, title: "Türkçe - Dil Bilgisi Karma Soru Çözümü", duration: "50 dk", status: "pending" }
      ]
    },
    {
      day: "Cumartesi",
      date: "06 Haziran",
      tasks: [
        { id: 11, title: "TYT Genel Deneme Sınavı & Analiz", duration: "165 dk", status: "pending" }
      ]
    },
    {
      day: "Pazar",
      date: "07 Haziran",
      tasks: [
        { id: 12, title: "Haftalık Genel Değerlendirme & Yeni Plan Planlama", duration: "45 dk", status: "pending" }
      ]
    }
  ]);

  // Görevin durumunu değiştiren fonksiyon
  const handleToggleTask = (dayIndex, taskId) => {
    const updatedPlan = weeklyPlanData.map((dayPlan, idx) => {
      if (idx === dayIndex) {
        return {
          ...dayPlan,
          tasks: dayPlan.tasks.map((task) => {
            if (task.id === taskId) {
              const newStatus = task.status === "completed" ? "pending" : "completed";
              return {
                ...task,
                status: newStatus
              };
            }
            return task;
          })
        };
      }
      return dayPlan;
    });
    setWeeklyPlanData(updatedPlan);
  };

  // Aylık Plan verileri (sabit)
  const monthlyPlan = [
    {
      weekNum: 1,
      title: "1. Hafta: Temel Konuların Tamamlanması",
      focus: "Matematikte sayılar ve Türkçede temel kuralların tekrarı.",
      color: "border-l-blue-500",
      tasksCount: 14
    },
    {
      weekNum: 2,
      title: "2. Hafta: Fen ve Sosyal Bilimler Ağırlığı",
      focus: "Fizik kuvvet ve hareket, Kimya atom teorisi, Tarih ilk çağlar.",
      color: "border-l-indigo-500",
      tasksCount: 12
    },
    {
      weekNum: 3,
      title: "3. Hafta: İleri Seviye Konular & Net Arttırma",
      focus: "Trigonometri, Modern Fizik ve Karma Paragraf pratikleri.",
      color: "border-l-purple-500",
      tasksCount: 16
    },
    {
      weekNum: 4,
      title: "4. Hafta: Genel Deneme Kampı & Eksiklerin Giderilmesi",
      focus: "Haftada 3 deneme sınavı, yanlış analizleri ve eksik giderici mikro çalışmalar.",
      color: "border-l-emerald-500",
      tasksCount: 10
    }
  ];

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planlanan Görevler</h1>
          <p className="text-sm text-slate-500 mt-1">Koçunuz tarafından hazırlanan ders çalışma ve deneme sınavı planınız.</p>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner shrink-0">
          <button 
            onClick={() => setViewMode("weekly")} 
            className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${viewMode === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Haftalık
          </button>
          <button 
            onClick={() => setViewMode("monthly")} 
            className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${viewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Aylık
          </button>
        </div>
      </div>

      {viewMode === "weekly" ? (
        <div className="space-y-6">
          {weeklyPlanData.map((dayPlan, dayIdx) => {
            const completedCount = dayPlan.tasks.filter(t => t.status === 'completed').length;
            const totalCount = dayPlan.tasks.length;
            
            return (
              <div key={dayIdx} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-lg">{dayPlan.day}</h3>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{dayPlan.date}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {completedCount}/{totalCount} Yapıldı
                  </span>
                </div>
                <div className="space-y-3">
                  {dayPlan.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => handleToggleTask(dayIdx, task.id)}
                      className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50/50 hover:scale-[1.002] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${task.status === 'completed' ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                          {task.status === 'completed' && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                        <span className={`text-sm font-semibold transition-all ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-400 font-semibold">{task.duration}</span>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${task.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                          {task.status === 'completed' ? 'Yapıldı' : 'Planlandı'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {monthlyPlan.map((weekPlan) => (
            <div key={weekPlan.weekNum} className={`bg-white p-6 rounded-2xl border border-slate-150 border-l-4 ${weekPlan.color} shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 text-lg leading-snug">{weekPlan.title}</h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full shrink-0">
                    {weekPlan.tasksCount} Görev
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">{weekPlan.focus}</p>
              </div>
              <button 
                onClick={() => setViewMode("weekly")}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
              >
                Haftalık Plana Git
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
