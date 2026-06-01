"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "STUDENT") {
      router.push("/teacher-dashboard");
      return;
    }
    setUser(parsedUser);

      // Load read notifications
      const storedRead = localStorage.getItem(`read_notifications_${parsedUser.id}`);
      if (storedRead) {
        setReadIds(JSON.parse(storedRead));
      }

      // Fetch notification items
      const fetchNotifications = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/student/notifications?studentId=${parsedUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setNotifications(data || []);
          }
        } catch (err) {
          console.error("Error fetching notifications:", err);
        }
      };

      fetchNotifications();
      // Poll for updates
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updatedRead = [...readIds, id];
      setReadIds(updatedRead);
      if (user) {
        localStorage.setItem(`read_notifications_${user.id}`, JSON.stringify(updatedRead));
      }
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    if (user) {
      localStorage.setItem(`read_notifications_${user.id}`, JSON.stringify(allIds));
    }
  };

  const unreadNotifications = notifications.filter(n => !readIds.includes(n.id));
  const hasUnread = unreadNotifications.length > 0;

  const getNavClass = (path) => {
    return pathname === path
      ? "bg-slate-700 p-2.5 rounded-xl cursor-pointer text-white"
      : "p-2.5 rounded-xl cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-white transition";
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800">
      
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-20 bg-[#1A1C23] items-center py-6 gap-8 shrink-0">
        <Link href="/dashboard" className={getNavClass("/dashboard")} title="Ana Sayfa">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        </Link>
        
        {/* Kitap butonu kaldırıldı, 2. buton Günlük Görevler (Pano) oldu */}
        <Link href="/dashboard/daily" className={getNavClass("/dashboard/daily")} title="Günlük Görevler">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
        </Link>

        {/* 3. Buton Planlanan Görevler (Takvim) oldu */}
        <Link href="/dashboard/planned" className={getNavClass("/dashboard/planned")} title="Planlanan Görevler">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        </Link>

        {/* 4. Buton İstatistik */}
        <Link href="/dashboard/statistics" className={getNavClass("/dashboard/statistics")} title="İstatistikler">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
        </Link>

        {/* Ayarlar */}
        <Link href="/dashboard/settings" className={`mt-auto ${getNavClass("/dashboard/settings")}`} title="Ayarlar">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </Link>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Ortak Header */}
        <header className="flex justify-between md:justify-end items-center bg-white p-4 m-4 md:m-8 lg:m-12 mb-0 rounded-2xl shadow-sm shrink-0">
          <button className="md:hidden p-2 text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <div className="flex items-center gap-4 relative">
            {/* Bildirim Çanı */}
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-slate-400 hover:text-slate-600 transition bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {hasUnread && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white animate-pulse"></span>
                )}
              </button>

              {/* Bildirim Dropdown Listesi */}
              {showDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-800 text-sm">Bildirimler ({unreadNotifications.length})</span>
                    {hasUnread && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
                      >
                        Tümünü Okundu Say
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto mt-2">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        Yeni bir bildirim bulunmuyor.
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const isRead = readIds.includes(notification.id);
                        return (
                          <div 
                            key={notification.id} 
                            onClick={() => handleMarkAsRead(notification.id)}
                            className={`px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${!isRead ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <p className={`text-xs ${!isRead ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                {notification.title}
                              </p>
                              {!isRead && (
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 shrink-0 animate-ping"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                              {notification.message}
                            </p>
                            <span className="text-[9px] text-slate-400 font-medium block mt-1.5">
                              {new Date(notification.time).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profil Resmi */}
            <img src={`https://ui-avatars.com/api/?name=${user ? encodeURIComponent(user.name) : 'Ogrenci'}&background=2563EB&color=fff&rounded=true`} alt="Profile" className="w-10 h-10 rounded-full border-2 border-slate-100" />
          </div>
        </header>

        {/* Sayfaların İçeriği Buraya Gelecek */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pt-4 md:pt-8 lg:pt-8 space-y-8">
          {children}
        </div>

      </main>
    </div>
  );
}
