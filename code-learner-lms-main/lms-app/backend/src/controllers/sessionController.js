const Session  = require('../models/Session');
const Question = require('../models/Question');
const Submission = require('../models/Submission');

// GET /api/sessions/course/:courseId
exports.getSessions = async (req, res) => {
  try {
    const isTeacher = req.user.role === 'teacher';
    const filter = { courseId: req.params.courseId };
    if (!isTeacher) filter.isActive = true;
    const sessions = await Session.find(filter).sort({ createdAt: -1 });
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
    const { name, description, courseId, isTimed, durationMinutes } = req.body;
    if (!name || !courseId) return res.status(400).json({ error: 'name and courseId are required.' });
    const session = await Session.create({
      name, description, courseId,
      createdBy: req.user.username,
      isTimed:         !!isTimed,
      durationMinutes: durationMinutes || 30,
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
    const fields = ['name', 'description', 'isTimed', 'durationMinutes', 'isActive', 'questions'];
    fields.forEach(f => { if (req.body[f] !== undefined) session[f] = req.body[f]; });
    const saved = await session.save();
    res.json(saved);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// DELETE /api/sessions/:id  (teacher only)
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found.' });
    // Delete only non-pool questions (pool questions belong to the course, not this session)
    await Question.deleteMany({ _id: { $in: session.questions }, inPool: { $ne: true } });
    res.json({ message: 'Session deleted.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/sessions/:id/questions  — add a question to a session (teacher only)
exports.addQuestion = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    const {
      title, description, difficulty, language,
      placeholderCode, driverPreCode, driverPostCode,
      testCases, hideTestCases, maxAttempts,
      answer, isAnswerVisible,
    } = req.body;
    if (!title || !description || !language) return res.status(400).json({ error: 'title, description and language are required.' });
    const question = await Question.create({
      title, description, difficulty: difficulty || 'medium',
      language, placeholderCode: placeholderCode || '',
      driverPreCode:  driverPreCode  || '',
      driverPostCode: driverPostCode || '',
      testCases: testCases || [],
      hideTestCases: !!hideTestCases,
      maxAttempts: maxAttempts || 0,
      answer: answer || null,
      isAnswerVisible: !!isAnswerVisible,
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
    // Only delete the question from DB if it's NOT a pool question
    const q = await Question.findById(req.params.qid);
    if (q && !q.inPool) await q.deleteOne();
    res.json(await session.populate('questions'));
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/sessions/:id/questions/from-pool  — link a pool question into this session
exports.addFromPool = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    const { questionIds } = req.body; // array of IDs
    if (!Array.isArray(questionIds) || !questionIds.length)
      return res.status(400).json({ error: 'questionIds array required.' });
    const existing = new Set(session.questions.map(id => id.toString()));
    for (const qid of questionIds) {
      if (!existing.has(qid)) { session.questions.push(qid); existing.add(qid); }
    }
    await session.save();
    res.json(await session.populate('questions'));
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/sessions/:id/randomize
// Body options:
//   Simple mode:  { count, replace, language }
//   Topic mode:   { topicConfig: [{ topic, count }], replace }
exports.randomizeFromPool = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const { replace = false, topicConfig, count = 5, language } = req.body;
    const shuffle = arr => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    let picked = [];

    if (Array.isArray(topicConfig) && topicConfig.length) {
      // Topic-wise mode: pick N from each specified topic
      for (const { topic, count: n } of topicConfig) {
        if (!topic || !n) continue;
        const qs = await Question.find({ courseId: session.courseId, inPool: true, topic: new RegExp(`^${topic}$`, 'i') });
        picked.push(...shuffle(qs).slice(0, Number(n)));
      }
    } else {
      // Simple mode: pick N total, optionally filtered by language
      const filter = { courseId: session.courseId, inPool: true };
      if (language) filter.language = language;
      const qs = await Question.find(filter);
      picked = shuffle(qs).slice(0, Math.min(Number(count), qs.length));
    }

    if (!picked.length) return res.status(400).json({ error: 'No matching questions found in pool.' });

    if (replace) {
      session.questions = picked.map(q => q._id);
    } else {
      const existing = new Set(session.questions.map(id => id.toString()));
      for (const q of picked) {
        if (!existing.has(q._id.toString())) { session.questions.push(q._id); existing.add(q._id.toString()); }
      }
    }
    await session.save();
    res.json({ session: await session.populate('questions'), picked: picked.length });
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
        code: '// Not attempted — session timed out.',
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
