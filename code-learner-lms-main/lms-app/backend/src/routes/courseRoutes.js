const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate, requireRole } = require('../middleware/auth');

// Teacher: create a new course (generates an enrollment code)
router.post('/', authenticate, requireRole('teacher'), courseController.createCourse);

// Teacher: list courses they created
router.get('/mine', authenticate, requireRole('teacher'), courseController.getMyCourses);

// Student: enroll in a course using its code + password + roll number
router.post('/enroll', authenticate, requireRole('student'), courseController.enrollCourse);

// Student: list courses they're enrolled in
router.get('/enrolled', authenticate, requireRole('student'), courseController.getEnrolledCourses);

// Student: re-verify roll number + password before opening a course's materials
router.post('/verify', authenticate, requireRole('student'), courseController.verifyCourseAccess);

// Teacher: delete a course and all its data
router.delete('/:code', authenticate, requireRole('teacher'), courseController.deleteCourse);

module.exports = router;
