import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const [role, setRole] = useState("teacher"); // only 'teacher' is allowed to self-register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kayıt işlemi başarısız oldu.");
      }

      setSuccess("Kayıt işlemi başarıyla tamamlandı! Giriş sayfasına yönlendiriliyorsunuz...");
      
      // Clear inputs
      setName("");
      setEmail("");
      setPassword("");

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* Sol Taraf - Bilgilendirme Yazısı */}
        <div className="flex flex-col justify-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#111827] leading-tight">
            Yolculuğa <br />
            <span className="text-[#2563EB]">Bugün Başla</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-md leading-relaxed">
            Hesabınızı oluşturarak hedeflerinize giden yolda yapay zeka destekli eğitim koçunuzdan faydalanmaya başlayın.
          </p>
        </div>

        {/* Sağ Taraf - Kayıt Formu Kartı */}
        <div className="w-full max-w-md mx-auto md:ml-auto">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
            
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Yeni Öğretmen Hesabı Oluştur</h2>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 font-medium border border-red-100 text-center">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm mb-6 font-medium border border-green-100 text-center">
                {success}
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleRegister}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">E-posta</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ogretmen@example.com"
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
                disabled={loading || success}
                className="w-full bg-[#2563EB] text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mt-2 shadow-sm disabled:bg-blue-400"
              >
                {loading ? "Kaydediliyor..." : "Kaydol"}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/" className="text-sm font-semibold text-[#2563EB] hover:text-blue-700 transition-colors">
                Zaten hesabınız var mı? Giriş Yapın
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
