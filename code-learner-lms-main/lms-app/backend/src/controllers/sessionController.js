const Session  = require('../models/Session');
const Question = require('../models/Question');
const Submission = require('../models/Submission');

// GET /api/sessions/course/:courseId
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ courseId: req.params.courseId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/sessions/:id  (with populated questions)
exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('questions');
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    res.json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/sessions  (teacher only)
exports.createSession = async (req, res) => {
  try {
    const { name, description, courseId, isTimed, durationMinutes, allowMultipleAttempts } = req.body;
    if (!name || !courseId) return res.status(400).json({ error: 'name and courseId are required.' });
    const session = await Session.create({
      name, description, courseId,
      createdBy: req.user.username,
      isTimed:               !!isTimed,
      durationMinutes:       durationMinutes || 30,
      allowMultipleAttempts: allowMultipleAttempts !== false,
      questions: [],
    });
    res.status(201).json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PUT /api/sessions/:id  (teacher only)
exports.updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found.' });
    const fields = ['name', 'description', 'isTimed', 'durationMinutes', 'allowMultipleAttempts', 'questions'];
    fields.forEach(f => { if (req.body[f] !== undefined) session[f] = req.body[f]; });
    res.json(await session.save());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// DELETE /api/sessions/:id  (teacher only)
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found.' });
    // Delete all questions in this session
    await Question.deleteMany({ _id: { $in: session.questions } });
    res.json({ message: 'Session deleted.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/sessions/:id/questions  — add a question to a session (teacher only)
exports.addQuestion = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    const { title, description, difficulty, language, placeholderCode, testCases, hideTestCases } = req.body;
    if (!title || !description || !language) return res.status(400).json({ error: 'title, description and language are required.' });
    const question = await Question.create({
      title, description, difficulty: difficulty || 'medium',
      language, placeholderCode: placeholderCode || '',
      testCases: testCases || [],
      hideTestCases: !!hideTestCases,
      courseId: session.courseId,
      createdBy: req.user.username,
    });
    session.questions.push(question._id);
    await session.save();
    res.status(201).json({ session: await session.populate('questions'), question });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// DELETE /api/sessions/:id/questions/:qid  (teacher only)
exports.removeQuestion = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    session.questions = session.questions.filter(q => q.toString() !== req.params.qid);
    await session.save();
    await Question.findByIdAndDelete(req.params.qid);
    res.json(await session.populate('questions'));
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/sessions/:id/auto-submit  — called when timer expires; submits empty for unattempted
exports.autoSubmit = async (req, res) => {
  try {
    const { studentId, studentUsername, courseId, attempted } = req.body;
    // attempted = array of questionIds the student already submitted
    const session = await Session.findById(req.params.id).populate('questions');
    if (!session) return res.status(404).json({ error: 'Not found.' });

    const attemptedSet = new Set(attempted || []);
    const unattempted = session.questions.filter(q => !attemptedSet.has(q._id.toString()));

    for (const q of unattempted) {
      await Submission.create({
        questionId: q._id,
        courseId,
        studentId,
        studentUsername,
        rollNumber: '',
        language: q.language || 'c',
        code: '',
        testResults: (q.testCases || []).map(tc => ({
          label: tc.label || '',
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          actualOutput: '',
          passed: false,
          isHidden: tc.isHidden || false,
        })),
        score: 0,
        totalPassed: 0,
        totalCases: (q.testCases || []).length,
        executionError: 'Not attempted — session timed out.',
      });
    }
    res.json({ autoSubmitted: unattempted.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
