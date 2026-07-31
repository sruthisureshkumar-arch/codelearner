const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⚠️  WARNING: JWT_SECRET is not set in .env — using insecure fallback. Set it before deploying!');
}
const _JWT_SECRET = JWT_SECRET || 'dev_secret_CHANGE_ME';

// Verifies the Bearer token and attaches { id, username, name, role, courseId } to req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, _JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Restricts a route to one or more roles, e.g. requireRole('teacher')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
