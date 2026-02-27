const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'secret-key-fallback';
    const decodified = jwt.verify(token.replace('Bearer ', ''), secret);
    req.user = decodified; // { id: userId, email: userEmail }
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Token inválido.' });
  }
}

module.exports = authMiddleware;
