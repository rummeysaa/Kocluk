import React from "react";

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Üst Bölüm: İkon ve Metinler */}
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Oturumu Kapatmak İstediğinize Emin Misiniz?
        </h3>
        <p className="text-sm text-slate-500 mb-8">
          Hesabınızdan çıkış yaptığınızda mevcut oturumunuz sonlandırılacaktır.
        </p>

        {/* Alt Butonlar */}
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            Vazgeç / İptal
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white hover:bg-red-700 px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-red-200"
          >
            Evet, Çıkış Yap
          </button>
        </div>

      </div>
    </div>
  );
}
