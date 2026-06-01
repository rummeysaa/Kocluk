import React, { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import TaskCompletionModal from "../../components/TaskCompletionModal";
import TaskInspectModal from "../../components/TaskInspectModal";
import FocusStation from "../../components/FocusStation";

export default function StudentDashboard() {
  const [tasks, setTasks] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [latestExam, setLatestExam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [inspectTask, setInspectTask] = useState(null);

  const fetchDashboardData = () => {
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

    setLoading(true);
    Promise.all([
      fetch(`http://localhost:5000/api/assignments/student/${studentId}`, fetchOptions).then(res => res.json()),
      fetch(`http://localhost:5000/api/progress/student/${studentId}`, fetchOptions).then(res => res.json()),
      fetch(`http://localhost:5000/api/exams/student/${studentId}`, fetchOptions).then(res => res.json())
    ])
    .then(([tasksData, progressData, examsData]) => {
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
            id: task.id,
            title: task.title,
            status: displayStatus,
            checked: task.status === 'COMPLETED',
            dueDate: task.dueDate,
            fileUrl: task.fileUrl,
            teacher: task.teacher
          };
        });
        
        const upcomingTasks = processedTasks
          .filter(task => !task.checked && !!task.dueDate)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 4);

        setTasks(upcomingTasks);
      }
      
      if (Array.isArray(progressData)) {
        setChartData(progressData);
      }
      
      if (Array.isArray(examsData)) {
        const tytExams = examsData.filter(e => e.examType === 'TYT');
        if (tytExams.length > 0) {
          setLatestExam(tytExams[tytExams.length - 1]);
        } else {
          setLatestExam(null);
        }
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Veriler çekilemedi:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDashboardData();
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



  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = user.name ? user.name.split(' ')[0] : 'Öğrenci';

  return (
    <>
      {/* Karşılama */}
      <div className="text-center md:text-left space-y-2 py-2">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Hoş geldin {firstName}!</h1>
        <p className="text-slate-500 italic text-sm md:text-base">Bugün yapacağın küçük adımlar, yarınki büyük başarıların temelidir.</p>
      </div>

      {/* Orta İki Kolon: Görevler ve Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Görevler Kartı */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Yaklaşan Görevlerim</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500 text-sm">Ödevler yükleniyor...</p>
            ) : tasks.length === 0 ? (
              <p className="text-slate-500 text-sm">Yaklaşan bir görevin bulunmuyor.</p>
            ) : (
              tasks.map((task) => {
                let dateDisplay = null;
                if (task.dueDate) {
                  const taskDate = new Date(task.dueDate);
                  taskDate.setHours(0, 0, 0, 0);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (taskDate.getTime() === today.getTime()) {
                    dateDisplay = "Bugün";
                  } else {
                    dateDisplay = taskDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  }
                }

                return (
                  <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between group py-2.5 px-3.5 border border-slate-100 rounded-2xl hover:border-blue-100 hover:shadow-sm transition-all bg-slate-50 hover:bg-white gap-3">
                    {/* Sol Alan: Checkbox, Görev Başlığı */}
                    <div 
                      className="flex items-start sm:items-center gap-3 select-none flex-1 cursor-pointer"
                      onClick={() => handleToggleTaskClick(task)}
                    >
                      {/* Checkbox */}
                      <div className="w-5 h-5 shrink-0 rounded flex items-center justify-center border-2 border-slate-300 bg-white group-hover:border-blue-400 transition-colors mt-0.5 sm:mt-0"></div>
                      
                      {/* Başlık */}
                      <div>
                        <h3 className="text-sm md:text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h3>
                      </div>
                    </div>

                    {/* Sağ Alan: 2 Sütunlu Hizalama */}
                    <div className="flex items-center justify-end gap-3 shrink-0 mt-3 sm:mt-0 w-full sm:w-auto">
                      
                      {/* 1. Sütun: Son Teslim Tarihi (w-28) */}
                      <div className="w-28 flex items-center justify-start gap-1.5 text-[11px] font-semibold text-slate-500">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>{dateDisplay || 'Süresiz'}</span>
                      </div>

                      {/* 2. Sütun: İncele Butonu (w-24) */}
                      <div className="w-24 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectTask(task);
                            setIsInspectOpen(true);
                          }}
                          className="bg-white text-slate-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-200 shadow-sm w-full"
                        >
                          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                          İncele
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* İlerleme Grafiği Kartı */}
        {(() => {
          // 1. Mantıksal Hesaplama Kısmı (React Logic)
          const now = new Date();
          
          // Örnek Görev Verisi (O Haftanın Görevleri)
          const weeklyTasks = [
            { id: 1, title: 'Matematik', isCompleted: true, deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2) },
            { id: 2, title: 'Fizik', isCompleted: false, deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1) },
            { id: 3, title: 'Türkçe', isCompleted: true, deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2) },
            { id: 4, title: 'Kimya', isCompleted: false, deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) }, // Gelecek (Kaçırılmadı)
            { id: 5, title: 'Biyoloji', isCompleted: true, deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
            { id: 6, title: 'Tarih', isCompleted: false, deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3) },
            { id: 7, title: 'Coğrafya', isCompleted: true, deadline: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3) }
          ];

          // Toplam İstatistikler
          const totalTasks = weeklyTasks.length;
          const completedTasks = weeklyTasks.filter(t => t.isCompleted).length;
          const missedTasks = weeklyTasks.filter(t => !t.isCompleted && new Date(t.deadline) < now).length;

          // Gün Bazlı Hesaplama
          const daysOfWeek = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
          const dailyData = daysOfWeek.map((dayName, index) => {
            // Task tarihlerini haftanın gününe eşleştirme (Gerçek projede daha hassas tarih eşleşmesi yapılır)
            const dayTasks = weeklyTasks.filter(t => {
               const dayIndex = t.deadline.getDay() === 0 ? 6 : t.deadline.getDay() - 1;
               return dayIndex === index;
            });
            return {
              day: dayName,
              completed: dayTasks.filter(t => t.isCompleted).length,
              missed: dayTasks.filter(t => !t.isCompleted && new Date(t.deadline) < now).length
            };
          });

          return (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Haftalık İlerleme</h2>
              
              {/* 2. Özet Bilgi Etiketleri (3'lü Grup) */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Atanan Toplam Görev: {totalTasks}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  Tamamlanan: {completedTasks}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  Teslim Tarihi Geçen (Kaçırılan): {missedTasks}
                </div>
              </div>
              
              {/* 3. Gün Gün Performans Grafiği */}
              <div className="flex-1 flex items-end justify-between gap-2 mt-auto pt-2 mb-6">
                {dailyData.map((item, idx) => {
                  const MAX_TASKS = 4; // Sabit yükseklik skalası
                  const completedHeight = Math.max((item.completed / MAX_TASKS) * 100, 0);
                  const missedHeight = Math.max((item.missed / MAX_TASKS) * 100, 0);
                  
                  return (
                    <div key={idx} className="flex flex-col items-center gap-3 w-full group">
                      <div className="w-full flex justify-center items-end gap-1 h-[120px] rounded-xl bg-slate-50/50 p-1 group-hover:bg-slate-50 transition-colors">
                        {/* Yeşil Bar (Tamamlanan) */}
                        <div 
                          className="w-full max-w-[12px] bg-emerald-400 rounded-t-md rounded-b-sm transition-all duration-500 ease-out relative" 
                          style={{ height: `${completedHeight}%`, minHeight: item.completed > 0 ? '4px' : '0' }}
                        >
                          {item.completed > 0 && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 pointer-events-none">
                              {item.completed}
                            </div>
                          )}
                        </div>

                        {/* Kırmızı Bar (Kaçırılan) */}
                        <div 
                          className="w-full max-w-[12px] bg-rose-400 rounded-t-md rounded-b-sm transition-all duration-500 ease-out relative" 
                          style={{ height: `${missedHeight}%`, minHeight: item.missed > 0 ? '4px' : '0' }}
                        >
                          {item.missed > 0 && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 pointer-events-none">
                              {item.missed}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-400">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      </div>

      {/* Focus Station */}
      <FocusStation studentId={user.id} token={localStorage.getItem('token')} />

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
    </>
  );
}
