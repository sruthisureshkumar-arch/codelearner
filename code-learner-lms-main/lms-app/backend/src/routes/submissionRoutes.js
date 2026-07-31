const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/submissionController');
const { authenticate, requireRole } = require('../middleware/auth');

// Students submit their own code (identity is taken from the JWT, not the request body)
router.post('/', authenticate, requireRole('student'), ctrl.submitCode);

// Teachers review all submissions for a question
router.get('/question/:questionId', authenticate, requireRole('teacher'), ctrl.getSubmissions);

// A student can view their own history; a teacher can view any student's history
router.get('/student/:studentId', authenticate, ctrl.getStudentHistory);

// Teacher drills into a student's full submission history for one question
router.get('/history', authenticate, requireRole('teacher'), ctrl.getSubmissionHistory);

module.exports = router;
