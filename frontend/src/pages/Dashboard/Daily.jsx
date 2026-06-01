import React, { useState, useEffect } from "react";
import TaskCompletionModal from "../../components/TaskCompletionModal";
import TaskInspectModal from "../../components/TaskInspectModal";

export default function DailyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [inspectTask, setInspectTask] = useState(null);
  
  // Bugünün tarihini istenen formatta ("23 Mayıs Cumartesi") oluşturuyoruz
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleDateString('tr-TR', { month: 'long' });
  const weekday = today.toLocaleDateString('tr-TR', { weekday: 'long' });
  const customDateString = `${day} ${month} ${weekday}`;

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!userStr || !token) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const studentId = user.id;

        const res = await fetch(`http://localhost:5000/api/assignments/student/${studentId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          
          // Gün sınırlarını ayarlıyoruz (00:00:00 ile 23:59:59 arası)
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);

          // Gelen ödevlerden dueDate'i bugüne denk gelenleri süzüyoruz ve kronolojik ters sıralıyoruz
          const dailyTasks = data.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate >= todayStart && taskDate <= todayEnd;
          }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          setTasks(dailyTasks);
        }
      } catch (err) {
        console.error("Görevler alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleToggleTaskClick = (task) => {
    // Kilit: Eğer görev zaten tamamlandıysa hiçbir işlem yapma
    if (task.status === 'COMPLETED') return;
    
    // Görevi tamamlamak istiyorsa modalı aç
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleModalConfirm = async ({ file, studentNote }) => {
    if (!selectedTask) return;
    
    // FormData hazırla
    const formData = new FormData();
    formData.append('status', 'COMPLETED');
    if (studentNote) formData.append('studentNote', studentNote);
    if (file) formData.append('file', file);

    await handleStatusUpdate(selectedTask.id, 'COMPLETED', formData);
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleStatusUpdate = async (taskId, newStatus, formData = null) => {
    // 1. Optimistic Update
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));

    try {
      const token = localStorage.getItem('token');
      const fetchOptions = {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      if (formData) {
        fetchOptions.body = formData;
      } else {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify({ status: newStatus });
      }

      const response = await fetch(`http://localhost:5000/api/assignments/${taskId}/status`, fetchOptions);
      if (response.ok) {
        const data = await response.json();
        if (data.updatedAssignment) {
          setTasks(prevTasks => prevTasks.map(task => {
            if (task.id === taskId) {
              return { 
                ...task, 
                studentNote: data.updatedAssignment.studentNote,
                submittedFileUrl: data.updatedAssignment.submittedFileUrl
              };
            }
            return task;
          }));
        }
      }
    } catch (err) {
      console.error('Görev güncellenemedi:', err);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      
      {/* Başlık Alanı */}
      <div className="mb-8 border-b border-slate-100 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Bugünün Görevleri — <span className="text-blue-600">{customDateString}</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">
          Sadece bugüne ait tamamlaman gereken görevler aşağıda listelenmiştir.
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-slate-400 font-medium animate-pulse">Görevler yükleniyor...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-5 shadow-sm">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-700">Harika!</h3>
          <p className="text-slate-500 mt-2 max-w-sm">
            Bugün tamamlaman gereken bir görev bulunmuyor. Günü kendine ayırabilir veya ekstra çalışmalar yapabilirsin. 🎉
          </p>
        </div>

      ) : (
        <div className="grid gap-4">
          {tasks.map(task => {
            const isCompleted = task.status === 'COMPLETED';
            
            return (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between group p-4 border border-slate-100 rounded-2xl hover:border-blue-100 hover:shadow-sm transition-all bg-slate-50 hover:bg-white gap-4">
                
                <div 
                  className={`flex items-start sm:items-center gap-4 select-none flex-1 ${
                    isCompleted ? "cursor-not-allowed opacity-90" : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (isCompleted) return;
                    handleToggleTaskClick(task);
                  }}
                >
                  {/* Checkbox */}
                  <div className={`w-6 h-6 shrink-0 rounded flex items-center justify-center border-2 transition-colors mt-0.5 sm:mt-0 ${isCompleted ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                    {isCompleted && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                  </div>
                  
                  {/* Görev Başlığı ve Detayı */}
                  <div>
                    <h3 className={`text-base font-bold transition-colors ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-blue-600'}`}>
                      {task.title}
                    </h3>
                    <div className="mt-1.5 flex items-center">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
                        Koç: {task.teacher?.name || 'Belirtilmedi'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sağ Alan: 3 Sütunlu Sabit Hizalama */}
                <div className="flex items-center justify-end gap-4 shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                  
                  {/* 1. Sütun: Durum Rozeti */}
                  <div className="w-24 flex justify-start">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide w-full text-center border ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                      {isCompleted ? 'Tamamlandı' : 'Bekliyor'}
                    </span>
                  </div>

                  {/* 2. Sütun: Son Teslim Tarihi */}
                  <div className="w-28 flex items-center justify-start gap-1.5 text-xs font-semibold text-slate-500">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : 'Süresiz'}</span>
                  </div>

                  {/* 3. Sütun: İncele Butonu */}
                  <div className="w-24 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectTask(task);
                        setIsInspectOpen(true);
                      }}
                      className="bg-white text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-200 shadow-sm w-full"
                    >
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      İncele
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <TaskCompletionModal
        isOpen={isModalOpen}
        taskTitle={selectedTask?.title}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onConfirm={handleModalConfirm}
      />

      {/* Inspect Modal */}
      <TaskInspectModal 
        isOpen={isInspectOpen}
        onClose={() => {
          setIsInspectOpen(false);
          setInspectTask(null);
        }}
        task={inspectTask}
      />
    </div>
  );
}
