import React, { useState, useEffect } from "react";

export default function FocusStation({ studentId, token }) {
  const [timerMode, setTimerMode] = useState('idle'); // Sadece 'idle' ve 'work'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [dailyFocusMinutes, setDailyFocusMinutes] = useState(0);

  // 1. Veritabanından Bugünkü Toplamı Çek (Cross-Device Persistence)
  const fetchTodayFocus = async () => {
    if (!studentId || !token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/focus-sessions/today/${studentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDailyFocusMinutes(data.totalMinutes || 0);
      }
    } catch (err) {
      console.error("Odaklanma verisi çekilemedi:", err);
    }
  };

  useEffect(() => {
    fetchTodayFocus();
  }, [studentId, token]);

  // 2. Sayfa Yenileme Koruması (localStorage)
  useEffect(() => {
    const savedTarget = localStorage.getItem('fs_targetTime');
    const savedDuration = localStorage.getItem('fs_totalDuration');
    const savedMode = localStorage.getItem('fs_timerMode');
    
    if (savedTarget && savedMode && savedDuration) {
      const now = Date.now();
      const target = parseInt(savedTarget, 10);
      
      if (target > now) {
        // Sayaç hala akıyor
        setTotalDuration(parseInt(savedDuration, 10));
        setTimerMode(savedMode);
        setTimeLeft(Math.round((target - now) / 1000));
        setIsRunning(true);
      } else {
        // Sayaç biz yokken bitmiş
        localStorage.removeItem('fs_targetTime');
        localStorage.removeItem('fs_totalDuration');
        localStorage.removeItem('fs_timerMode');
      }
    }
  }, []);

  // 3. Timer Engine
  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft <= 0) {
      setIsRunning(false);
      clearInterval(interval);
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Saf Odaklanma: Süre bitince mola vermez, direkt kaydeder ve sıfırlar.
  const handleSessionComplete = async () => {
    localStorage.removeItem('fs_targetTime');
    
    if (timerMode === 'work') {
      const completedMins = Math.floor(totalDuration / 60);
      
      // Backend'e kaydet
      if (studentId && token) {
        try {
          await fetch('http://localhost:5000/api/focus-sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ duration: completedMins })
          });
          // Günlük toplamı yeniden çekerek ekrana yansıt
          fetchTodayFocus();
        } catch (error) {
          console.error("Focus session kaydedilemedi:", error);
        }
      }

      setTimerMode('idle');
      setTotalDuration(25 * 60); 
      setTimeLeft(25 * 60);
    }
  };

  const startTimer = (minutes) => {
    const seconds = minutes * 60;
    setTotalDuration(seconds);
    setTimeLeft(seconds);
    setTimerMode('work');
    setIsRunning(true);
    
    // Güvenlik için localstorage kaydı
    localStorage.setItem('fs_targetTime', (Date.now() + seconds * 1000).toString());
    localStorage.setItem('fs_totalDuration', seconds.toString());
    localStorage.setItem('fs_timerMode', 'work');
  };

  const toggleTimer = () => {
    if (!isRunning) {
      if (timerMode === 'idle') setTimerMode('work');
      localStorage.setItem('fs_targetTime', (Date.now() + timeLeft * 1000).toString());
      localStorage.setItem('fs_totalDuration', totalDuration.toString());
      localStorage.setItem('fs_timerMode', timerMode === 'idle' ? 'work' : timerMode);
    } else {
      localStorage.removeItem('fs_targetTime'); // Duraklatıldığında target time silinir
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalDuration);
    localStorage.removeItem('fs_targetTime');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const mins = parseInt(customTimeInput, 10);
    if (!isNaN(mins) && mins > 0) {
      startTimer(mins);
      setCustomTimeInput('');
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Genişletilmiş SVG hesaplamaları
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = totalDuration > 0 ? circumference - (timeLeft / totalDuration) * circumference : 0;

  return (
    <div className="mt-6 w-full bg-white rounded-3xl p-6 md:p-10 flex flex-col items-center justify-center relative shadow-sm border border-slate-100 overflow-hidden">
      
      {/* Daily Tracker */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 z-10">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
        <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">
          Bugünkü Toplam Odak: <span className="text-indigo-600 font-black text-sm">{dailyFocusMinutes}</span> dk
        </span>
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-12 mt-8 md:mt-4">
        
        {/* Sol Kısım: Progress Bar */}
        <div className="flex flex-col items-center shrink-0 w-full md:w-1/2">
          
          {/* Minimalist Markalama */}
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-6 tracking-tighter opacity-90">
            ODAK
          </h2>
          
          <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle 
                cx="80" cy="80" r={radius} 
                className="text-slate-50" 
                strokeWidth="4" stroke="currentColor" fill="none" 
              />
              <circle 
                cx="80" cy="80" r={radius} 
                className="text-indigo-600 transition-all duration-1000 ease-linear" 
                strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
              />
            </svg>
            <div className="flex flex-col items-center mt-2">
              <span className="text-4xl md:text-5xl font-black text-slate-800 tabular-nums tracking-tighter">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-10">
            <button 
              onClick={toggleTimer}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95"
            >
              {isRunning ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-6 h-6 pl-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </button>
            <button 
              onClick={resetTimer}
              className="w-14 h-14 rounded-full flex items-center justify-center text-slate-400 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* Sağ Kısım: Butonlar */}
        <div className="flex-1 w-full flex flex-col justify-center max-w-lg mt-8 md:mt-0">
          <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4 text-center md:text-left">Hızlı Modlar</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={() => startTimer(165)} className="px-5 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col items-center justify-center gap-1.5">
              <span className="font-black text-slate-700 group-hover:text-indigo-600 text-sm tracking-wide">TYT Modu</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md uppercase tracking-wider">165 dk</span>
            </button>
            <button onClick={() => startTimer(180)} className="px-5 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col items-center justify-center gap-1.5">
              <span className="font-black text-slate-700 group-hover:text-indigo-600 text-sm tracking-wide">AYT Modu</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md uppercase tracking-wider">180 dk</span>
            </button>
            <button onClick={() => startTimer(180)} className="px-5 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col items-center justify-center gap-1.5">
              <span className="font-black text-slate-700 group-hover:text-indigo-600 text-sm tracking-wide">YDT Modu</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md uppercase tracking-wider">180 dk</span>
            </button>
            <button onClick={() => startTimer(25)} className="px-5 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col items-center justify-center gap-1.5">
              <span className="font-black text-slate-700 group-hover:text-indigo-600 text-sm tracking-wide">Pomodoro</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md uppercase tracking-wider">25 dk</span>
            </button>
          </div>

          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3 block text-center md:text-left">ÖZEL SÜRE BELİRLE</label>
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-3">
              <div className="relative flex-1">
                <input 
                  type="number" 
                  min="1" 
                  max="999"
                  value={customTimeInput}
                  onChange={(e) => setCustomTimeInput(e.target.value)}
                  placeholder="Dakika (Örn: 45)" 
                  className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:font-normal placeholder:text-slate-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">dk</span>
              </div>
              <button type="submit" className="bg-white text-slate-600 hover:bg-slate-50 px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm active:scale-95 shrink-0">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Başlat
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
