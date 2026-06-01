import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import LogoutModal from "../components/LogoutModal";
import AiCoachWidget from "../components/AiCoachWidget";

export default function DashboardLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Drawer State

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'Öğrenci';
  const roleText = user.role === 'ADMIN' ? 'Sistem Yöneticisi' : 'YKS Öğrencisi';
  const firstName = userName.split(' ')[0] || 'Kullanıcı';

  // Desktop Navbar Class (Sadece İkon)
  const getNavClassDesktop = (path) => {
    return pathname === path
      ? "bg-indigo-600 p-3 rounded-2xl cursor-pointer text-white shadow-md shadow-indigo-500/20"
      : "p-3 rounded-2xl cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-white transition-all";
  };

  // Mobile Navbar Class (İkon + Metin)
  const getNavClassMobile = (path) => {
    return pathname === path
      ? "flex items-center gap-4 bg-indigo-600 p-3.5 rounded-2xl cursor-pointer text-white shadow-md shadow-indigo-500/20"
      : "flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-white transition-all";
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
    e.stopPropagation(); 
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* 1. MASAÜSTÜ EKRAN DÜZENİ (Desktop Sidebar) */}
      <aside className="hidden md:flex flex-col w-[88px] bg-slate-900 items-center py-8 gap-8 shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <Link to="/dashboard" className={getNavClassDesktop("/dashboard")} title="Ana Sayfa">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        </Link>
        
        <Link to="/dashboard/daily" className={getNavClassDesktop("/dashboard/daily")} title="Günlük Görevler">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
        </Link>

        <Link to="/dashboard/planned" className={getNavClassDesktop("/dashboard/planned")} title="Planlanan Görevler">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        </Link>

        <Link to="/dashboard/statistics" className={getNavClassDesktop("/dashboard/statistics")} title="İstatistikler">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
        </Link>

        <div className="mt-auto flex flex-col items-center gap-6 w-full px-4">
          <Link to="/dashboard/settings" className={getNavClassDesktop("/dashboard/settings")} title="Ayarlar">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </Link>

          <button onClick={() => setIsLogoutModalOpen(true)} className="p-3 rounded-2xl cursor-pointer hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all" title="Güvenli Çıkış">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>
      </aside>

      {/* 2. MOBİL EKRAN DÜZENİ: Ovelay ve Drawer (Mobile Menu) */}
      {/* Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col py-8 shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-8 mb-10">
          <span className="text-white font-black tracking-tight text-2xl">Eğitim Koçu</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white bg-slate-800/50 p-2 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="flex flex-col gap-3 px-6">
          <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={getNavClassMobile("/dashboard")}>
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span className="font-bold tracking-wide text-sm">Ana Sayfa</span>
          </Link>
          <Link to="/dashboard/daily" onClick={() => setIsMobileMenuOpen(false)} className={getNavClassMobile("/dashboard/daily")}>
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            <span className="font-bold tracking-wide text-sm">Günlük Görevler</span>
          </Link>
          <Link to="/dashboard/planned" onClick={() => setIsMobileMenuOpen(false)} className={getNavClassMobile("/dashboard/planned")}>
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span className="font-bold tracking-wide text-sm">Planlanan Görevler</span>
          </Link>
          <Link to="/dashboard/statistics" onClick={() => setIsMobileMenuOpen(false)} className={getNavClassMobile("/dashboard/statistics")}>
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
            <span className="font-bold tracking-wide text-sm">İstatistikler</span>
          </Link>
        </div>
        
        <div className="mt-auto flex flex-col gap-3 px-6">
          <div className="h-px w-full bg-slate-800 mb-2"></div>
          <Link to="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)} className={getNavClassMobile("/dashboard/settings")}>
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span className="font-bold tracking-wide text-sm">Ayarlar</span>
          </Link>
          <button onClick={() => { setIsLogoutModalOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span className="font-bold tracking-wide text-sm">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        
        {/* Ortak Header (Mobile Navbar + Desktop Header) */}
        <header className="flex justify-between md:justify-end items-center bg-white py-3 px-4 md:py-4 md:px-6 mx-4 mt-4 md:mx-8 md:mt-6 lg:mx-12 lg:mt-8 mb-2 rounded-2xl shadow-sm border border-slate-100 shrink-0 z-10 sticky top-4 md:relative md:top-0">
          
          {/* Mobil İçin Hamburger Menü Butonu */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>

          {/* Orta Alan: Mobil Marka (Sadece mobilde görünür, mutlak ortalanır) */}
          <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
            <span className="text-lg font-black text-slate-800 tracking-tight">Eğitim Koçu</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Bildirim Menüsü */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] text-white flex items-center justify-center font-bold shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-50 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800">Bildirimler</h3>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {unreadCount} Yeni
                      </span>
                    )}
                  </div>
                  
                  <div className="max-h-[60vh] md:max-h-80 overflow-y-auto custom-calendar-scroll">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        <span className="text-sm font-medium">Henüz hiç bildiriminiz yok.</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => handleMarkSingleAsRead(notif)}
                            className={`p-4 transition-colors cursor-pointer relative group ${notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/80'}`}
                          >
                            <div className="flex items-start gap-3 pr-8">
                              <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.isRead ? 'bg-slate-300' : 'bg-indigo-500'}`}></div>
                              <div>
                                <p className={`text-sm ${notif.isRead ? 'text-slate-600 font-medium' : 'text-slate-800 font-bold'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap leading-relaxed">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                  {new Date(notif.createdAt).toLocaleDateString('tr-TR', { hour: '2-digit', minute:'2-digit' })}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSingle(e, notif.id)}
                              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                              title="Bildirimi Sil"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="flex-1 text-center text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors py-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 shadow-sm"
                        >
                          Tümünü Okundu İşaretle
                        </button>
                      )}
                      <button 
                        onClick={handleClearAll}
                        className="flex-1 text-center text-xs font-bold text-slate-600 hover:text-red-600 transition-colors py-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 shadow-sm"
                      >
                        Tümünü Temizle
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Öğrenci Profili */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-800">{userName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{roleText}</p>
              </div>
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=4F46E5&color=fff&rounded=true&bold=true`} alt="Profile" className="w-10 h-10 rounded-xl border-2 border-slate-100 shadow-sm" />
            </div>
          </div>
        </header>

        {/* 5. İÇERİK ALANI HİZALAMASI */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:p-8 lg:p-12 md:pt-4 space-y-6 md:space-y-8 w-full">
          <Outlet />
        </div>

      </main>

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
      
      {/* Global Yüzen AI Asistan */}
      {user.role === 'STUDENT' && <AiCoachWidget />}
    </div>
  );
}
