import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [role, setRole] = useState("student"); // 'student' or 'teacher'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız.');
      }

      // Token ve User bilgisini kaydet
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Rol bazlı yönlendirme
      if (data.user.role === 'TEACHER' || data.user.role === 'ADMIN') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            
            {/* Öğrenci/Öğretmen Seçimi */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8">
              <button
                onClick={() => setRole("student")}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  role === "student"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
                Öğrenci
              </button>
              
              <button
                onClick={() => setRole("teacher")}
                className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  role === "teacher"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                </svg>
                Öğretmen
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">E-posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={role === "student" ? "ogrenci@example.com" : "ogretmen@example.com"}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Şifre</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2563EB] text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mt-2 shadow-sm disabled:opacity-70"
              >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                {!loading && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="#" className="text-sm font-medium text-[#2563EB] hover:text-blue-700 transition-colors">
                Şifremi Unuttum
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
