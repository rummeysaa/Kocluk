import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Token yoksa girişe yönlendir
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Rol kontrolü (Eğer spesifik bir rol istenmişse)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Rolü yetmeyen kişiyi uygun sayfaya geri fırlat (Örn: Öğrenciyse dashboard, öğretmense teacher-dashboard)
    if (user.role === 'TEACHER') return <Navigate to="/teacher-dashboard" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
