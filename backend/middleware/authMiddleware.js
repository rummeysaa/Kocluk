const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtar-kocluk-2026';

// Token'ı doğrulayan genel middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Beklenen format: "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Erişim reddedildi. Token bulunamadı.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }
    
    // Doğrulanan kullanıcıyı request objesine ekle
    req.user = user;
    next();
  });
};

// Rollere göre yetki kısıtlaması yapan middleware
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu sayfaya erişim yetkiniz yok.' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  checkRole,
  JWT_SECRET
};
