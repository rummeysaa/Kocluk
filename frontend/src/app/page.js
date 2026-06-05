"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [role, setRole] = useState("student"); // 'student' or 'teacher'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Şifre Sıfırlama State'leri
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Giriş başarısız oldu.");
      }

      // Check role matches selected role (case insensitive comparison)
      const userRole = data.user.role.toLowerCase();
      if (userRole !== role) {
        let roleName = "Öğrenci";
        if (role === "teacher") roleName = "Öğretmen";
        throw new Error(`Seçtiğiniz rol (${roleName}) bu kullanıcının sistemdeki gerçek rolüyle eşleşmiyor.`);
      }

      // Save user details to localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (userRole === "teacher") {
        router.push("/teacher-dashboard");
      } else {
        router.push("/dashboard");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (resetPassword !== resetConfirmPassword) {
      setResetError('Şifreler eşleşmiyor.');
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, password: resetPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Şifre güncellenemedi.');
      }

      setResetSuccess('Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.');
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetEmail('');
        setResetPassword('');
        setResetConfirmPassword('');
        setResetSuccess('');
      }, 2000);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* Sol Taraf - Yazı */}
        <div className="flex flex-col justify-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#111827] leading-tight">
            Eğitimde Yapay Zeka <br />
            <span className="text-[#2563EB]">Güçlü Gelecek</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-md leading-relaxed">
            Öğrencilerin başarısını takip edin, yapay zeka destekli analizlerle gelişimi hızlandırın.
          </p>
        </div>

        {/* Sağ Taraf - Form Kartı */}
        <div className="w-full max-w-md mx-auto md:ml-auto">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
            
            {/* Rol Seçimi (Öğrenci / Öğretmen) */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8">
              <button
                type="button"
                onClick={() => {
                  setRole("student");
                  setError("");
                }}
                className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  role === "student"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
                Öğrenci
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setRole("teacher");
                  setError("");
                }}
                className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  role === "teacher"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
                Öğretmen
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 font-medium border border-red-100">
                {error}
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">E-posta</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === "student" ? "ogrenci@example.com" : "ogretmen@example.com"}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Şifre</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2563EB] text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mt-2 shadow-sm disabled:bg-blue-400"
              >
                {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <div>
                <Link href="/register" className="text-sm font-semibold text-[#2563EB] hover:text-blue-700 transition-colors">
                  Hesabınız yok mu? Kaydolun
                </Link>
              </div>
              <div>
                <button 
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Şifremi Unuttum
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Şifremi Unuttum Modali */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Şifremi Güncelle</h3>
              <button 
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetEmail('');
                  setResetPassword('');
                  setResetConfirmPassword('');
                  setResetSuccess('');
                  setResetError('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {resetError && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl mb-4 text-xs font-semibold text-center border border-red-100">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="bg-green-50 text-green-600 p-3.5 rounded-xl mb-4 text-xs font-semibold text-center border border-green-100">
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  placeholder="ogrenci@example.com veya ogretmen@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Yeni Şifre</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-[#2563EB] text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mt-2 shadow-sm disabled:opacity-70 text-sm"
              >
                {resetLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
