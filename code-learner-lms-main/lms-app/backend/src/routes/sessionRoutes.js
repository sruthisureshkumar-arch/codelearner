const express = require('express');
const router  = express.Router();
const sc      = require('../controllers/sessionController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/course/:courseId',           authenticate, sc.getSessions);
router.get('/:id',                        authenticate, sc.getSession);
router.post('/',                          authenticate, requireRole('teacher'), sc.createSession);
router.put('/:id',                        authenticate, requireRole('teacher'), sc.updateSession);
router.delete('/:id',                     authenticate, requireRole('teacher'), sc.deleteSession);
router.post('/:id/questions',             authenticate, requireRole('teacher'), sc.addQuestion);
router.post('/:id/questions/from-pool',   authenticate, requireRole('teacher'), sc.addFromPool);
router.post('/:id/randomize',             authenticate, requireRole('teacher'), sc.randomizeFromPool);
router.delete('/:id/questions/:qid',      authenticate, requireRole('teacher'), sc.removeQuestion);
router.post('/:id/auto-submit',           authenticate, sc.autoSubmit);

module.exports = router;
