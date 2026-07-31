const Course      = require('../models/Course');
const Enrollment  = require('../models/Enrollment');
const User        = require('../models/User');
const Question    = require('../models/Question');
const Submission  = require('../models/Submission');
const Grade       = require('../models/Grade');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// POST /api/courses  (teacher)  { name, description, password }
exports.createCourse = async (req, res) => {
  try {
    const { name, description, password, code: requestedCode } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Course name is required.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Enrollment password must be at least 4 characters.' });
    }

    let code;
    if (requestedCode && requestedCode.trim()) {
      const candidate = requestedCode.trim().toUpperCase();
      if (!/^[A-Z0-9]{4,10}$/.test(candidate)) {
        return res.status(400).json({ error: 'Course code must be 4–10 letters/numbers (A–Z, 0–9).' });
      }
      if (await Course.findOne({ code: candidate })) {
        return res.status(409).json({ error: 'That course code is already taken. Please choose another.' });
      }
      code = candidate;
    } else {
      // Generate a unique course code
      for (let attempt = 0; attempt < 8; attempt++) {
        const candidate = generateCode();
        // eslint-disable-next-line no-await-in-loop
        if (!(await Course.findOne({ code: candidate }))) {
          code = candidate;
          break;
        }
      }
      if (!code) {
        return res.status(500).json({ error: 'Could not generate a unique course code. Please try again.' });
      }
    }

    const course = await Course.create({
      name: name.trim(),
      description: (description || '').trim(),
      code,
      passwordHash: password,       // hashed by pre-save hook
      enrollmentPassword: password, // plaintext for teacher display
      createdBy: req.user.username,
    });

    res.status(201).json(course);
  } catch (err) {
    console.error('createCourse error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/courses/mine  (teacher) — courses this teacher created
exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ createdBy: req.user.username }).sort({ createdAt: -1 });
    const result = await Promise.all(courses.map(async (c) => {
      const studentCount = await Enrollment.countDocuments({ courseCode: c.code });
      return { ...c.toJSON(), studentCount };
    }));
    res.json(result);
  } catch (err) {
    console.error('getMyCourses error:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/courses/enroll  (student)  { code, password, rollNumber }
exports.enrollCourse = async (req, res) => {
  try {
    const { code, password, rollNumber } = req.body;
    if (!code || !password) {
      return res.status(400).json({ error: 'Course code and password are required.' });
    }
    if (!rollNumber || !rollNumber.trim()) {
      return res.status(400).json({ error: 'Roll number is required.' });
    }

    const course = await Course.findOne({ code: code.trim().toUpperCase() });
    if (!course) {
      return res.status(404).json({ error: 'No course found with that code.' });
    }

    const ok = await course.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Incorrect course password.' });
    }

    const existing = await Enrollment.findOne({ studentUsername: req.user.username, courseCode: course.code });
    if (existing) {
      return res.status(409).json({ error: 'You are already enrolled in this course.' });
    }

    const enrollment = await Enrollment.create({
      studentUsername: req.user.username,
      studentName: req.user.name,
      rollNumber: rollNumber.trim(),
      courseCode: course.code,
    });

    // Save the roll number to the student's profile if it isn't set yet
    const user = await User.findById(req.user.id);
    if (user && !user.rollNumber) {
      user.rollNumber = rollNumber.trim();
      await user.save();
    }

    res.status(201).json({
      enrollment,
      course: { code: course.code, name: course.name, description: course.description },
    });
  } catch (err) {
    console.error('enrollCourse error:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/courses/verify  (student)  { code, password, rollNumber }
// Re-checks the course password + roll number for a course the student is
// already enrolled in, before letting them open that course's materials.
exports.verifyCourseAccess = async (req, res) => {
  try {
    const { code, password, rollNumber } = req.body;
    if (!code || !password || !rollNumber || !rollNumber.trim()) {
      return res.status(400).json({ error: 'Course password and roll number are required.' });
    }

    const course = await Course.findOne({ code: code.trim().toUpperCase() });
    if (!course) {
      return res.status(404).json({ error: 'No course found with that code.' });
    }

    const enrollment = await Enrollment.findOne({ studentUsername: req.user.username, courseCode: course.code });
    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course.' });
    }

    const passwordOk = await course.comparePassword(password);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Incorrect course password.' });
    }

    if (enrollment.rollNumber.trim().toLowerCase() !== rollNumber.trim().toLowerCase()) {
      return res.status(401).json({ error: 'Roll number does not match our records for this course.' });
    }

    res.json({ ok: true, course: { code: course.code, name: course.name, description: course.description } });
  } catch (err) {
    console.error('verifyCourseAccess error:', err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/courses/:code  (teacher) — delete a course and all its data
exports.deleteCourse = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const course = await Course.findOne({ code });
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    if (course.createdBy !== req.user.username) {
      return res.status(403).json({ error: 'You can only delete your own courses.' });
    }

    // Delete everything associated with this course
    const questions = await Question.find({ courseId: code }, '_id');
    const questionIds = questions.map(q => q._id);

    await Promise.all([
      Course.deleteOne({ code }),
      Enrollment.deleteMany({ courseCode: code }),
      Question.deleteMany({ courseId: code }),
      Submission.deleteMany({ courseId: code }),
      Submission.deleteMany({ questionId: { $in: questionIds } }),
      Grade.deleteMany({ courseId: code }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error('deleteCourse error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/courses/enrolled  (student) — courses this student has enrolled in
exports.getEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentUsername: req.user.username }).sort({ createdAt: 1 });
    const codes = enrollments.map(e => e.courseCode);
    const courses = await Course.find({ code: { $in: codes } });

    const result = enrollments.map(e => {
      const c = courses.find(c => c.code === e.courseCode);
      return {
        code: e.courseCode,
        rollNumber: e.rollNumber,
        name: c ? c.name : e.courseCode,
        description: c ? c.description : '',
        enrolledAt: e.createdAt,
      };
    });
    res.json(result);
  } catch (err) {
    console.error('getEnrolledCourses error:', err);
    res.status(500).json({ error: err.message });
  }
};
