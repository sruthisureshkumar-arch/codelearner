const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/authController');
const rateLimit  = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');

// Max 20 login attempts per IP per 15 minutes — prevents brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes and try again.' },
});

router.post('/register', ctrl.register);
router.post('/login',    loginLimiter, ctrl.login);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
