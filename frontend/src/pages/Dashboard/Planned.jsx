import React, { useState, useEffect } from "react";
import TaskCompletionModal from "../../components/TaskCompletionModal";
import TaskInspectModal from "../../components/TaskInspectModal";

// Helpers for calendar
const getWeeklyCalendarDays = () => {
  const days = [];
  const curr = new Date();
  curr.setHours(0,0,0,0);
  const day = curr.getDay(); // 0=Sun, 1=Mon
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
  curr.setDate(diff);

  for (let i = 0; i < 7; i++) {
    days.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return days;
};

const getMonthlyCalendarDays = () => {
  const curr = new Date();
  curr.setHours(0,0,0,0);
  const year = curr.getFullYear();
  const month = curr.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const daysInMonth = lastDay.getDate();
  let startDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon
  if (startDayOfWeek === 0) startDayOfWeek = 7;
  
  const calendarCells = [];
  for (let i = 1; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(new Date(year, month, i));
  }
  
  return calendarCells;
};

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function PlannedTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('ALL'); // 'ALL', 'WEEKLY', 'MONTHLY'
  const [onlyPending, setOnlyPending] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [inspectTask, setInspectTask] = useState(null);

  const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      setLoading(false);
      return;
    }
    
    const user = JSON.parse(userStr);
    const studentId = user.id;

    const fetchOptions = {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    };

    fetch(`http://localhost:5000/api/assignments/student/${studentId}`, fetchOptions)
      .then(res => res.json())
      .then(tasksData => {
        if (Array.isArray(tasksData)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const processedTasks = tasksData.map(task => {
            let displayStatus = "Bekliyor";
            
            if (task.status === 'COMPLETED') {
              displayStatus = "Tamamlandı";
            } else if (task.status === 'PENDING' && task.dueDate) {
              const taskDate = new Date(task.dueDate);
              taskDate.setHours(0, 0, 0, 0);
              
              if (taskDate < today) {
                displayStatus = "Gecikti";
              }
            }

            return {
              ...task,
              status: displayStatus,
              checked: task.status === 'COMPLETED'
            };
          });
          
          setTasks(processedTasks);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Görevler çekilemedi:", err);
        setLoading(false);
      });
  }, []);

  const handleToggleTaskClick = (task) => {
    // Kilit: Eğer görev zaten tamamlandıysa hiçbir işlem yapma
    if (task.checked) return;
    
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
    // 1. Optimistic Update (Ekranı anında güncelle)
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return { 
          ...task, 
          checked: newStatus === 'COMPLETED', 
          status: newStatus === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor' 
        };
      }
      return task;
    }));

    // 2. Backend'e gönder
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Planlanan Görevler</h1>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Yalnızca Bekleyenler Toggle (Sol) */}
          <button 
            onClick={() => setOnlyPending(!onlyPending)} 
            className={`px-4 py-1.5 shadow-sm rounded-lg text-sm font-medium transition border w-full md:w-auto ${onlyPending ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            Sadece Bekleyenler
          </button>
          
          {/* Filtre Toggle (Sağ) */}
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            <button 
              onClick={() => setViewMode('ALL')} 
              className={`flex-1 md:flex-none px-4 py-1.5 shadow-sm rounded text-sm font-medium transition whitespace-nowrap ${viewMode === 'ALL' ? 'bg-white text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >Tümü</button>
            <button 
              onClick={() => setViewMode('WEEKLY')} 
              className={`flex-1 md:flex-none px-4 py-1.5 shadow-sm rounded text-sm font-medium transition whitespace-nowrap ${viewMode === 'WEEKLY' ? 'bg-white text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >Haftalık</button>
            <button 
              onClick={() => setViewMode('MONTHLY')} 
              className={`flex-1 md:flex-none px-4 py-1.5 shadow-sm rounded text-sm font-medium transition whitespace-nowrap ${viewMode === 'MONTHLY' ? 'bg-white text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >Aylık</button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <p className="text-slate-500">Atanmış tüm görevlerinizi buradan detaylı olarak inceleyebilir ve tamamlayabilirsiniz.</p>
        
        {/* Renk Kılavuzu (Legend) */}
        {(viewMode === 'WEEKLY' || viewMode === 'MONTHLY') && (
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Tamamlandı
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Bekliyor
            </div>
          </div>
        )}
      </div>
      
      <div className="max-w-6xl">
        {loading ? (
          <p className="text-slate-500 text-sm">Görevler yükleniyor...</p>
        ) : tasks.length === 0 ? (
          <p className="text-slate-500 text-sm">Henüz planlanmış bir göreviniz bulunmuyor.</p>
        ) : viewMode === 'WEEKLY' ? (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {getWeeklyCalendarDays().map((day, idx) => {
              const dayTasks = tasks.filter(t => t.dueDate && isSameDay(t.dueDate, day) && (!onlyPending || !t.checked));
              return (
                <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-100 flex flex-col h-[400px] overflow-hidden">
                  <div className="text-center p-4 pb-2 border-b border-slate-200 shrink-0">
                    <p className="text-xs font-bold text-slate-400 uppercase">{dayNames[idx]}</p>
                    <p className="text-xl font-bold text-slate-700">{day.getDate()}</p>
                  </div>
                  <div className="overflow-y-auto flex-1 p-3 space-y-3 mac-scrollbar">
                    {dayTasks.map(task => (
                      <div 
                        key={task.id} 
                        onClick={() => { setInspectTask(task); setIsInspectOpen(true); }}
                        className={`rounded-lg p-1.5 text-xs font-medium cursor-pointer transition-transform hover:scale-[1.02] border ${task.checked ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}
                      >
                        <div className="truncate">{task.title}</div>
                      </div>
                    ))}
                    {dayTasks.length === 0 && <p className="text-xs text-slate-400 text-center italic mt-4">Görev yok</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'MONTHLY' ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(name => (
                  <div key={name} className="text-center text-xs font-bold text-slate-400 uppercase py-2">{name}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getMonthlyCalendarDays().map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="bg-slate-50/50 rounded-xl h-[160px]"></div>;
                  
                  const isToday = isSameDay(day, new Date());
                  const dayTasks = tasks.filter(t => t.dueDate && isSameDay(t.dueDate, day) && (!onlyPending || !t.checked));
                  
                  return (
                    <div key={idx} className={`rounded-xl border flex flex-col transition-colors hover:border-blue-200 h-[160px] overflow-hidden ${isToday ? 'border-blue-400 bg-blue-50/30' : 'border-slate-100 bg-white'}`}>
                      <div className="text-right p-2 shrink-0">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${isToday ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
                          {day.getDate()}
                        </span>
                      </div>
                      <div className="overflow-y-auto flex-1 px-2 pb-2 space-y-1.5 mac-scrollbar">
                        {dayTasks.map(task => (
                          <div 
                            key={task.id} 
                            onClick={() => { setInspectTask(task); setIsInspectOpen(true); }}
                            className={`rounded-lg p-1.5 text-xs font-medium cursor-pointer transition-transform hover:scale-[1.02] border ${task.checked ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}
                            title={task.title}
                          >
                            <div className="truncate">{task.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-5xl">
            {(onlyPending ? sortedTasks.filter(t => !t.checked) : sortedTasks).map((task) => (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between group p-4 border border-slate-100 rounded-2xl hover:border-blue-100 hover:shadow-sm transition-all bg-slate-50 hover:bg-white gap-4">
                
                <div 
                  className={`flex items-start sm:items-center gap-4 select-none flex-1 ${
                    task.checked ? "cursor-not-allowed opacity-90" : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (task.checked) return;
                    handleToggleTaskClick(task);
                  }}
                >
                  {/* Checkbox */}
                  <div className={`w-6 h-6 shrink-0 rounded flex items-center justify-center border-2 transition-colors mt-0.5 sm:mt-0 ${task.checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                    {task.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                  </div>
                  
                  {/* Görev Başlığı ve Detayı */}
                  <div>
                    <h3 className={`text-base font-bold transition-colors ${task.checked ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-blue-600'}`}>
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
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide w-full text-center border ${task.checked ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                      {task.checked ? 'Tamamlandı' : 'Bekliyor'}
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
            ))}
          </div>
        )}
      </div>

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
