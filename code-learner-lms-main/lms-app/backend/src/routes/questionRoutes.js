const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, requireRole } = require('../middleware/auth');

// Get all questions for a course (any logged-in user)
router.get('/course/:courseId', authenticate, questionController.getQuestions);

// Get single question (any logged-in user)
router.get('/:id', authenticate, questionController.getQuestion);

// Create new question (teacher only)
router.post('/', authenticate, requireRole('teacher'), questionController.createQuestion);

// Update question (teacher only)
router.put('/:id', authenticate, requireRole('teacher'), questionController.updateQuestion);

// Submit/Update model answer (teacher only)
router.post('/:id/answer', authenticate, requireRole('teacher'), questionController.submitAnswer);

// Update answer visibility (teacher only)
router.patch('/:id/visibility', authenticate, requireRole('teacher'), questionController.updateAnswerVisibility);

// Generate AI placeholder code (teacher only)
router.post('/:id/generate-placeholder', authenticate, requireRole('teacher'), questionController.generatePlaceholder);

// Delete question (teacher only)
router.delete('/:id', authenticate, requireRole('teacher'), questionController.deleteQuestion);

module.exports = router;
