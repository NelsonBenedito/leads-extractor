const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decodified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decodified; // { id: userId, email: userEmail }
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Token inválido.' });
  }
}

module.exports = authMiddleware;
