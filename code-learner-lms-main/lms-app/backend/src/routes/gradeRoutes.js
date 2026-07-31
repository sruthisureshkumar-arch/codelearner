const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/gradeController');
const { authenticate, requireRole } = require('../middleware/auth');

// Full gradebook (teacher only)
router.get('/course/:courseId',  authenticate, requireRole('teacher'), ctrl.getCourseGrades);
// CSV export (teacher only)
router.get('/export/:courseId',  authenticate, requireRole('teacher'), ctrl.exportGrades);
// A student can view their own grade; a teacher can view any student's grade
router.get('/student/:studentId', authenticate, ctrl.getStudentGrade);

module.exports = router;
