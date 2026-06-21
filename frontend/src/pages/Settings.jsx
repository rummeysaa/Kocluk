import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem('token');

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data.user);
        setCoaches(data.coaches || []);
        setStudents(data.students || []);
        setName(data.user.name);
        setEmail(data.user.email);
        setDepartment(data.user.department || '');
      } else {
        setError(data.error || 'Profil bilgileri yüklenemedi.');
      }
    } catch (err) {
      console.error(err);
      setError('Bağlantı hatası: Sunucuya ulaşılamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          ...(profile.role === 'STUDENT' && { department }),
          ...(password && { password })
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Profil bilgileriniz başarıyla güncellendi.');
        setProfile(data.user);
        // LocalStorage'ı da güncel tutalım
        localStorage.setItem('user', JSON.stringify(data.user));
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Güncelleme başarısız oldu.');
      }
    } catch (err) {
      console.error(err);
      setError('Bir sunucu hatası oluştu.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const roleText = profile?.role === 'TEACHER' ? 'Rehber Öğretmen' : profile?.role === 'ADMIN' ? 'Sistem Yöneticisi' : 'Öğrenci';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Hesap Bilgilerim</h1>
        <p className="text-sm text-slate-500 mt-1">Hesap ayarlarınızı yönetin ve profil bilgilerinizi güncelleyin.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sol Kolon: Profil Özet Kartı ve Öğretmen Bağlantıları */}
        <div className="space-y-8 md:col-span-1">
          {/* Avatar Kartı */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl mb-4 border border-indigo-100 shadow-inner">
              {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
            </div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">{profile?.name}</h2>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full mt-2 border border-indigo-100">
              {roleText}
            </span>
            <p className="text-xs text-slate-400 mt-4 break-all">{profile?.email}</p>
          </div>

          {/* Bağlı Öğretmenler Kartı (Sadece Öğrenci İçin) */}
          {profile?.role === 'STUDENT' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Bağlı Rehber Öğretmenlerim
              </h3>

              {coaches.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 leading-relaxed bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  Şu an atanmış aktif bir rehber öğretmeniniz bulunmamaktadır.
                </div>
              ) : (
                <div className="space-y-3">
                  {coaches.map((coach) => (
                    <div
                      key={coach.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {coach.name ? coach.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'O'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate">{coach.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{coach.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bağlı Öğrenciler Kartı (Sadece Öğretmen İçin) */}
          {profile?.role === 'TEACHER' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.004 9.004 0 00-12 0M15 10a3 3 0 11-6 0m12 2.72a9.004 9.004 0 01-12 0" />
                </svg>
                Bağlı Öğrencilerim ({students.length})
              </h3>

              {students.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 leading-relaxed bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  Henüz rehberlik ettiğiniz bir öğrenci bulunmamaktadır.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {student.name ? student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'S'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate">{student.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{student.email} • {student.department || 'Alan Yok'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sağ Kolon: Güncelleme Formu */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 md:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Profil Bilgilerini Düzenle</h3>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-posta</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                />
              </div>
            </div>

            {profile?.role === 'STUDENT' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bölüm (Örn: SAY, EA, SÖZ)</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors bg-white"
                >
                  <option value="">Seçiniz</option>
                  <option value="SAY">Sayısal (SAY)</option>
                  <option value="EA">Eşit Ağırlık (EA)</option>
                  <option value="SOZ">Sözel (SÖZ)</option>
                  <option value="DIL">Yabancı Dil (DİL)</option>
                </select>
              </div>
            )}

            <div className="h-px bg-slate-100 my-6"></div>

            <h4 className="text-sm font-bold text-slate-800 mb-4">Şifre Değiştir (İsteğe Bağlı)</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Yeni Şifre</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 disabled:opacity-50 text-sm"
              >
                {updating ? 'Kaydediliyor...' : 'Bilgileri Güncelle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
