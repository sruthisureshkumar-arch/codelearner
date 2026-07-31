const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/authController');
const rateLimit  = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');

// Use Redis store if available (required for PM2 cluster mode — otherwise each
// worker has its own counter and the effective limit is max × numCPUs).
let loginLimiterStore;
try {
  const { RedisStore } = require('rate-limit-redis');
  const Redis = require('ioredis');
  const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    enableOfflineQueue: false,
    lazyConnect: true,
    connectTimeout: 2000,
  });
  redisClient.on('error', () => {}); // suppress unhandled errors if Redis is absent
  loginLimiterStore = new RedisStore({ sendCommand: (...args) => redisClient.call(...args) });
  console.log('Rate limiter: using Redis store');
} catch {
  console.warn('Rate limiter: Redis not available, using in-memory store (not accurate in cluster mode)');
}

// Max 20 login attempts per IP per 15 minutes — prevents brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: loginLimiterStore, // undefined = default memory store
  message: { error: 'Too many login attempts. Please wait 15 minutes and try again.' },
});

router.post('/register', ctrl.register);
router.post('/login',    loginLimiter, ctrl.login);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
