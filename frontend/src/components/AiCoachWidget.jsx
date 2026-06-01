import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function AiCoachWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentActionType, setCurrentActionType] = useState("");
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const widgetRef = useRef(null);

  // Click outside to close (hide) without losing state
  useEffect(() => {
    function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const studentName = user.name ? user.name.split(' ')[0] : 'Öğrenci';
  const token = localStorage.getItem('token');

  // Fetch active session or past messages on open
  useEffect(() => {
    if (isOpen && !sessionId) {
      // Sadece panel ilk açıldığında geçmiş oturumları çek (opsiyonel)
      // Burada sıfırdan "Yeni Sohbet" mantığı güdülebilir veya en son oda yüklenebilir.
      // Biz şimdilik temiz bir başlangıç yapıyoruz.
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text = "", file = null, actionType = "", isInitialCard = false) => {
    if (!text.trim() && !file && !isInitialCard) return;

    // Sadece manuel mesajlarda veya dosya yuklemelerinde kullanici balonunu ekle
    if (!isInitialCard) {
      const tempId = Date.now().toString();
      const newUserMsg = {
        id: tempId,
        sender: "student",
        message: text,
        imageUrl: file ? URL.createObjectURL(file) : null,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, newUserMsg]);
      setInputText("");
    }
    
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (text) formData.append("message", text);
      if (file) formData.append("file", file);
      if (sessionId) formData.append("sessionId", sessionId);
      if (actionType) formData.append("actionType", actionType);

      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      // Eğer backend yeni sessionId dönerse (data.sessionId gibi), state'i güncelle
      // Backend api şu an ChatMessage döndürüyor, onun içinde sessionId var.
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "err",
        sender: "ai",
        message: "Bağlantı hatası: Yapay zeka koçu ile iletişim kurulamadı.",
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Dosya seçildiği an gönder (actionType = solve_question varsayılarak veya genel)
      handleSendMessage("Fotoğrafı analiz edebilir misin?", file, "solve_question");
      e.target.value = null; // reset
    }
  };

  const handleCardClick = (actionType) => {
    setCurrentActionType(actionType);
    if (actionType === 'solve_question') {
      // Dosya seçiciyi tetikle
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      // Inputu boş bırak, user mesajını (mavi balon) basma ve API'ye actionType yolla
      setInputText("");
      handleSendMessage("", null, actionType, true);
    }
  };

  return (
    <>
      {/* Gizli File Input */}
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/jpg" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Tetikleyici Buton (FAB) */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center ${isOpen ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}
        title="AI Koçum"
      >
        <svg className="w-7 h-7 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {/* Arka plan overlay (Mobilde dışarı tıklamayı yakalamak için opsiyonel, şimdilik sadece panel) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm sm:hidden" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sağdan Açılan Panel */}
      <div 
        ref={widgetRef}
        className={`fixed bottom-0 sm:bottom-6 right-0 sm:right-6 z-50 w-full sm:w-96 h-[85vh] sm:h-[600px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full sm:translate-x-[120%]'}`}
      >
        {/* Panel Başlığı */}
        <div className="bg-slate-800/80 backdrop-blur border-b border-slate-700 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm tracking-wide">AI Koçum</h3>
                {messages.length > 0 && (
                  <button 
                    onClick={() => {
                      setMessages([]);
                      setSessionId(null); // Tamamen yeni bir konuya başlanabilmesi için session'ı da sıfırlıyoruz.
                      setCurrentActionType(""); // Konuyu sıfırla
                    }}
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-md"
                  >
                    <span className="text-sm leading-none -mt-0.5">‹</span> Seçeneklere Dön
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs text-slate-400">Gemini 2.5 Flash Lite</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Mesaj Alanı */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900/50 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          
          {/* Akıllı Karşılama (Mesaj Yoksa) */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-2 animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 shadow-inner">
                <span className="text-3xl">✨</span>
              </div>
              <h4 className="text-white font-bold text-lg mb-2">Selam {studentName}!</h4>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Ben senin yapay zeka sınav koçunum. TYT, AYT veya YDT fark etmeksizin tüm alanlarda yanındayım. Bugün hangi strateji üzerine konuşuyoruz?
              </p>
              
              <div className="w-full space-y-2">
                <button 
                  onClick={() => handleCardClick('solve_question')}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all text-left group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">📸</span>
                  <div>
                    <p className="text-white text-sm font-semibold">Fotoğraflı Soru Çözümü</p>
                    <p className="text-xs text-slate-400 mt-0.5">Çözemediğiniz soruların fotoğraflarını yükleyin, adım adım analiz edelim.</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleCardClick('analyze_nets')}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50 rounded-xl transition-all text-left group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
                  <div>
                    <p className="text-white text-sm font-semibold">Akademik Durum & Net Analizi</p>
                    <p className="text-xs text-slate-400 mt-0.5">Sistemdeki deneme geçmişiniz üzerinden ders bazlı grafik ve gelişim analizi alın.</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleCardClick('strategy_and_methods')}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all text-left group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">🎯</span>
                  <div>
                    <p className="text-white text-sm font-semibold">Sınav Stratejileri & Çalışma Metotları</p>
                    <p className="text-xs text-slate-400 mt-0.5">Ders bazlı eksikler, sınav taktikleri ve anlamadığınız konuların pratik anlatımı hakkında rehberlik alın.</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            // Mesajlar Akışı
            <div className="flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-[13px] sm:text-sm ${msg.sender === 'student' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'}`}>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Uploaded" className="max-w-full h-auto rounded-lg mb-2 object-cover border border-slate-700/50" />
                    )}
                    {msg.message && (
                      <div className="whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none text-[13px] sm:text-sm">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                        >
                          {msg.message}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Yükleniyor Göstergesi */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    <span className="text-xs text-slate-400 ml-1 font-medium">AI Koçum inceliyor...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Alanı */}
        <div className="p-4 bg-slate-800/80 backdrop-blur border-t border-slate-700 shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) {
                handleSendMessage(inputText, null, currentActionType);
              }
            }} 
            className="flex items-center gap-2"
          >
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors shrink-0"
              title="Fotoğraf Yükle"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Koçuna bir şeyler sor..."
              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
              disabled={isLoading}
            />
            
            <button 
              type="submit" 
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
