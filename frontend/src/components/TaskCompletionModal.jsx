import React, { useState, useRef } from "react";

export default function TaskCompletionModal({ isOpen, onClose, onConfirm, taskTitle }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [studentNote, setStudentNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm({ file: selectedFile, studentNote });
    // Cleanup state after confirm
    setSelectedFile(null);
    setStudentNote("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setStudentNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Icon & Text */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">
            Görevi Tamamlamayı Onaylıyor Musunuz?
          </h2>
          {taskTitle && (
            <p className="text-blue-600 font-medium mt-1">"{taskTitle}"</p>
          )}
          <p className="text-sm text-slate-500 mt-2">
            Bu işlem hocanızın panelindeki istatistikleri doğrudan etkileyecektir. Bu işlem geri alınamaz.
          </p>
        </div>

        {/* File Upload Area */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Teslim Dosyası (Opsiyonel)</label>
          <div 
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <button 
              type="button" 
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors shrink-0"
            >
              Göz at...
            </button>
            <div className="flex-1 overflow-hidden">
              <span className="text-sm text-slate-600 truncate block">
                {selectedFile ? selectedFile.name : "Dosya seçilmedi."}
              </span>
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Ödevinize ait çözüm fotoğrafı veya PDF yükleyebilirsiniz.</p>
        </div>

        {/* Teacher Note Area */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Öğretmene Not (Opsiyonel)</label>
          <textarea
            className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none h-24"
            placeholder="Ödevle ilgili öğretmeninize iletmek istediğiniz notlar..."
            value={studentNote}
            onChange={(e) => setStudentNote(e.target.value)}
          ></textarea>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vazgeç
          </button>
          <button 
            type="button" 
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? "Onaylanıyor..." : "Evet, Onaylıyorum"}
          </button>
        </div>

      </div>
    </div>
  );
}
