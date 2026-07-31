const Grade = require('../models/Grade');

// GET /api/grades/course/:courseId  — full gradebook (teacher view)
exports.getCourseGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ courseId: req.params.courseId });
    // Sort by roll number (numeric-aware), students without roll number go last
    grades.sort((a, b) => {
      if (!a.rollNumber && !b.rollNumber) return a.studentId.localeCompare(b.studentId);
      if (!a.rollNumber) return 1;
      if (!b.rollNumber) return -1;
      return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
    });
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/grades/student/:studentId?courseId=xxx
exports.getStudentGrade = async (req, res) => {
  try {
    // Students may only view their own grade; teachers can view anyone's.
    if (req.user.role === 'student' && req.user.name !== req.params.studentId) {
      return res.status(403).json({ error: 'You can only view your own grade.' });
    }
    const filter = { studentId: req.params.studentId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const grade = await Grade.findOne(filter);
    res.json(grade || { studentId: req.params.studentId, grades: [], totalScore: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
