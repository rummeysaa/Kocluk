import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import LogoutModal from "../components/LogoutModal";

export default function TeacherDashboardLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'Öğretmen';
  const roleText = user.role === 'ADMIN' ? 'Sistem Yöneticisi' : 'Rehber Öğretmen';
  const firstName = userName.split(' ')[0] || 'Kullanıcı';

  const getNavClass = (path) => {
    return pathname === path
      ? "bg-[#2563EB] p-2.5 rounded-xl cursor-pointer text-white shadow-md" // Öğretmen için mavi vurgu
      : "p-2.5 rounded-xl cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-white transition";
  };

  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  const fetchNotifications = () => {
    const token = localStorage.getItem('token');
    if (!token || !user.id) return;
    
    fetch(`http://localhost:5000/api/notifications/student/${user.id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    })
    .catch(err => console.error("Bildirimler çekilemedi:", err));
  };

  useEffect(() => {
    if (user.id) fetchNotifications();
  }, [user.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/student/${user.id}/read-all`, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Bildirimler okundu işaretlenemedi:", error);
    }
  };

  const handleMarkSingleAsRead = async (notif) => {
    if (notif.isRead) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notif.id}/read`, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      console.error("Bildirim okundu işaretlenemedi:", error);
    }
  };

  const handleDeleteSingle = async (e, id) => {
    e.stopPropagation(); // prevent mark as read
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error("Bildirim silinemedi:", error);
    }
  };

  const handleClearAll = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/student/${user.id}/clear-all`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Bildirimler temizlenemedi:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800">
      
      {/* Sidebar - Öğretmen Paneli */}
      <aside className="hidden md:flex flex-col w-20 bg-[#1e293b] items-center py-6 gap-8 shrink-0">
        {/* 1. Buton: Ana Sayfa */}
        <Link to="/teacher-dashboard" className={getNavClass("/teacher-dashboard")} title="Öğretmen Ana Sayfası">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        </Link>
        
        {/* 2. Buton: Görev Ver (Öğrenciye Görev Atama) */}
        <Link to="/teacher-dashboard/assign" className={getNavClass("/teacher-dashboard/assign")} title="Öğrenciye Görev Ver">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
        </Link>

        {/* 3. Buton: Öğrenci Analizleri */}
        <Link to="/teacher-dashboard/analytics" className={getNavClass("/teacher-dashboard/analytics")} title="Öğrenci Analizleri">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
        </Link>

        <div className="mt-auto flex flex-col items-center gap-6">
          {/* Ayarlar */}
          <Link to="/teacher-dashboard/settings" className={getNavClass("/teacher-dashboard/settings")} title="Ayarlar">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </Link>

          {/* Çıkış Yap */}
          <button onClick={() => setIsLogoutModalOpen(true)} className="p-2.5 rounded-xl cursor-pointer hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition" title="Güvenli Çıkış">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Ortak Header */}
        <header className="flex justify-between md:justify-end items-center bg-white py-3 px-4 m-4 md:mx-8 md:mt-6 lg:mx-12 lg:mt-6 mb-0 rounded-2xl shadow-sm shrink-0">
          <button className="md:hidden p-2 text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <div className="flex items-center gap-4">
            {/* Bildirim Menüsü */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] text-white flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-800">Bildirimler</h3>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} Yeni
                      </span>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto custom-calendar-scroll">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        Henüz hiç bildiriminiz yok.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => handleMarkSingleAsRead(notif)}
                            className={`p-4 transition-colors cursor-pointer relative group ${notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                          >
                            <div className="flex items-start gap-3 pr-6">
                              <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.isRead ? 'bg-slate-300' : 'bg-blue-500'}`}></div>
                              <div>
                                <p className={`text-sm ${notif.isRead ? 'text-slate-600 font-medium' : 'text-slate-800 font-bold'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-wrap">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString('tr-TR', { hour: '2-digit', minute:'2-digit' })}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSingle(e, notif.id)}
                              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              title="Bildirimi Sil"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-slate-100 bg-slate-50 flex gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="flex-1 text-center text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors py-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200"
                        >
                          Tümünü Okundu İşaretle
                        </button>
                      )}
                      <button 
                        onClick={handleClearAll}
                        className="flex-1 text-center text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors py-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200"
                      >
                        Tümünü Temizle
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Öğretmen Profili */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-800">{userName}</p>
                <p className="text-xs text-slate-500">{roleText}</p>
              </div>
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=1e293b&color=fff&rounded=true`} alt="Teacher Profile" className="w-10 h-10 rounded-full border-2 border-slate-100" />
            </div>
          </div>
        </header>

        {/* Sayfaların İçeriği */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pt-4 md:pt-5 lg:pt-5 space-y-8">
          <Outlet />
        </div>

      </main>

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
