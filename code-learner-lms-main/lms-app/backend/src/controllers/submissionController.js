const axios     = require('axios');
const { spawn } = require('child_process');
const fs        = require('fs');
const path      = require('path');
const os        = require('os');
const Submission = require('../models/Submission');
const Question   = require('../models/Question');
const Grade      = require('../models/Grade');
const Enrollment = require('../models/Enrollment');

// Sort helper — compares roll numbers "naturally" so "21CS002" < "21CS010"
// (splits into chunks of digits/non-digits and compares digit chunks numerically).
function compareRollNumbers(a = '', b = '') {
  const chunk = s => String(s).match(/\d+|\D+/g) || [];
  const ca = chunk(a), cb = chunk(b);
  const len = Math.max(ca.length, cb.length);
  for (let i = 0; i < len; i++) {
    const x = ca[i] || '', y = cb[i] || '';
    if (x === y) continue;
    const xNum = /^\d+$/.test(x), yNum = /^\d+$/.test(y);
    if (xNum && yNum) {
      const diff = Number(x) - Number(y);
      if (diff !== 0) return diff;
    } else {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

const JUDGE0_URL = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';

// Judge0 language IDs
const JUDGE0_LANG = {
  python:     71,   // Python 3.8.1
  javascript: 63,   // Node.js 12.14.0
  c:          50,   // C (GCC 9.2.0)
  cpp:        54,   // C++ (GCC 9.2.0)
  java:       62,   // Java (OpenJDK 13.0.1)
  csharp:     51,   // C# (Mono 6.6.0)
  ruby:       72,   // Ruby 2.7.0
  sql:        82,   // SQLite (3.27.2)
};

// ── MIPS execution via local SPIM ──
function runMips(code, stdin = '') {
  return new Promise((resolve) => {
    const tmpFile = path.join(os.tmpdir(), `mips_${Date.now()}_${Math.random().toString(36).slice(2)}.asm`);
    fs.writeFileSync(tmpFile, code);

    let stdout = '';
    let stderr = '';
    const proc = spawn('spim', ['-f', tmpFile], { timeout: 10000 });

    proc.stdin.write(stdin || '');
    proc.stdin.end();
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    const cleanup = () => { try { fs.unlinkSync(tmpFile); } catch (_) {} };

    proc.on('close', (code, signal) => {
      cleanup();

      // Process killed by the 10s timeout (infinite loop, etc.)
      if (signal) {
        return resolve({ output: null, error: `MIPS program timed out or was killed (${signal}).` });
      }

      // Strip SPIM header lines (everything up to and including the last "Loaded:" line)
      const lines = stdout.split('\n');
      const lastLoaded = lines.reduce((acc, l, i) => l.startsWith('Loaded:') ? i : acc, -1);
      const clean = lines.slice(lastLoaded + 1).join('\n').trim();

      // SPIM prints assembly/runtime errors in stdout prefixed with "spim:",
      // and sometimes as "Exception occurred ..." lines.
      const spimErr = lines.find(l => /^spim:/i.test(l) || /^exception occurred/i.test(l));
      if (spimErr) {
        return resolve({ output: clean || null, error: spimErr.trim() });
      }

      // Surface anything written to stderr as an error too.
      if (stderr && stderr.trim()) {
        return resolve({ output: clean || null, error: stderr.trim() });
      }

      resolve({ output: clean, error: null });
    });

    proc.on('error', (err) => {
      cleanup();
      if (err.code === 'ENOENT') {
        resolve({ output: null, error: 'SPIM is not installed. Run: brew install spim' });
      } else {
        resolve({ output: null, error: err.message });
      }
    });
  });
}

// Run code for a single test case via Judge0 (or SPIM for MIPS)
async function runCode(language, code, stdin = '') {
  // MIPS → run locally via SPIM
  if (language === 'mips') {
    return runMips(code, stdin);
  }

  const langId = JUDGE0_LANG[language];
  if (!langId) {
    return { output: null, error: `Language "${language}" is not supported.` };
  }
  try {
    const res = await axios.post(JUDGE0_URL, {
      source_code: code,
      language_id: langId,
      stdin:       stdin || '',
      cpu_time_limit: 5,
      memory_limit:   128000,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const { stdout, stderr, compile_output, status } = res.data;

    // Compilation error
    if (compile_output && compile_output.trim()) {
      return { output: null, error: compile_output.trim() };
    }
    // Runtime error
    if (stderr && stderr.trim()) {
      return { output: null, error: stderr.trim() };
    }
    // Time limit / other status errors
    if (status && status.id > 3) {
      return { output: null, error: status.description };
    }
    return { output: (stdout || '').trim(), error: null };
  } catch (err) {
    return { output: null, error: err.message };
  }
}

// POST /api/submissions  — run code + save submission
exports.submitCode = async (req, res) => {
  try {
    const { questionId, courseId, language, code } = req.body;
    // Identity comes from the authenticated JWT, not the request body,
    // so a student can't submit code under another student's name.
    const studentId = req.user.name;
    const studentUsername = req.user.username;
    if (!questionId || !language || !code) {
      return res.status(400).json({ error: 'questionId, language and code are required.' });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    // Look up this student's roll number for the course (if enrolled)
    let rollNumber = '';
    try {
      const enrollment = await Enrollment.findOne({
        studentUsername: (studentUsername || '').toLowerCase(),
        courseCode: (courseId || question.courseId || '').toUpperCase(),
      });
      if (enrollment) rollNumber = enrollment.rollNumber || '';
    } catch (_) { /* ignore lookup errors */ }

    const testCases = question.testCases || [];
    const testResults = [];
    let totalPassed = 0;
    let executionError = null;

    if (testCases.length === 0) {
      // No test cases configured for this question — just run the code and
      // show the raw output. There's nothing to compare against, so this is
      // NOT a pass/fail verdict (passed: null), and it isn't scored/graded.
      const { output, error } = await runCode(language, code, '');
      executionError = error;
      testResults.push({
        label: 'Output (no test cases configured)',
        input: '',
        expectedOutput: '',
        actualOutput: output || '',
        passed: null,
        isHidden: false,
      });
    } else {
      for (const tc of testCases) {
        const { output, error } = await runCode(language, code, tc.input);
        if (error && !executionError) executionError = error;
        const actual = output || '';
        const expected = (tc.expectedOutput || '').trim();
        const passed = !error && actual === expected;
        if (passed) totalPassed++;
        testResults.push({
          label:          tc.label || '',
          input:          tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          actualOutput:   actual,
          passed,
          isHidden:       tc.isHidden || false,
        });
      }
    }

    // Only real test cases (with an expected output to compare against)
    // count toward the score and gradebook.
    const totalCases = testCases.length;
    const score = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : 0;

    const submission = await Submission.create({
      questionId,
      courseId:      courseId || question.courseId,
      studentId,
      studentUsername,
      rollNumber,
      language,
      code,
      testResults,
      score,
      totalPassed,
      totalCases,
      executionError,
    });

    // Update grade record (only when there are real test cases to grade against)
    if (totalCases > 0) {
      await updateGrade(studentId, courseId || question.courseId, questionId, question.title, score);
    }

    res.json(submission);
  } catch (err) {
    console.error('submitCode error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/submissions/question/:questionId?studentId=xxx
// Teacher view: by default returns ONE row per student — their most recent
// submission for this question — sorted by roll number. Pass ?all=true to
// get the full submission history instead (most recent first).
exports.getSubmissions = async (req, res) => {
  try {
    const filter = { questionId: req.params.questionId };
    if (req.query.studentId) filter.studentId = req.query.studentId;
    const subs = await Submission.find(filter).sort({ submittedAt: -1 });

    if (req.query.all === 'true') {
      return res.json(subs);
    }

    // Collapse to the latest submission per student, with attempt counts.
    const latestByStudent = new Map();
    for (const sub of subs) {
      const key = sub.studentUsername || sub.studentId;
      const entry = latestByStudent.get(key);
      if (!entry) {
        latestByStudent.set(key, { ...sub.toObject(), attempts: 1 });
      } else {
        entry.attempts += 1;
      }
    }

    const result = Array.from(latestByStudent.values()).sort((a, b) => {
      const byRoll = compareRollNumbers(a.rollNumber, b.rollNumber);
      if (byRoll !== 0) return byRoll;
      // Students without a roll number sort after those with one
      if (!a.rollNumber && b.rollNumber) return 1;
      if (a.rollNumber && !b.rollNumber) return -1;
      return (a.studentId || '').localeCompare(b.studentId || '');
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/submissions/student/:studentId?courseId=xxx
exports.getStudentHistory = async (req, res) => {
  try {
    // Students may only view their own submission history; teachers can view anyone's.
    if (req.user.role === 'student' && req.user.name !== req.params.studentId) {
      return res.status(403).json({ error: 'You can only view your own submission history.' });
    }
    const filter = { studentId: req.params.studentId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const subs = await Submission.find(filter)
      .populate('questionId', 'title difficulty language')
      .sort({ submittedAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper — upsert grade after each submission
async function updateGrade(studentId, courseId, questionId, questionTitle, score) {
  try {
    let grade = await Grade.findOne({ studentId, courseId });
    if (!grade) {
      grade = new Grade({ studentId, courseId, grades: [], totalScore: 0 });
    }
    const idx = grade.grades.findIndex(g => g.questionId.toString() === questionId.toString());
    if (idx === -1) {
      grade.grades.push({ questionId, questionTitle, bestScore: score, attempts: 1, lastSubmittedAt: new Date() });
    } else {
      grade.grades[idx].attempts += 1;
      grade.grades[idx].lastSubmittedAt = new Date();
      if (score > grade.grades[idx].bestScore) grade.grades[idx].bestScore = score;
    }
    // total = average of best scores
    const total = grade.grades.reduce((sum, g) => sum + g.bestScore, 0);
    grade.totalScore = grade.grades.length > 0 ? Math.round(total / grade.grades.length) : 0;
    grade.updatedAt = new Date();
    await grade.save();
  } catch (e) {
    console.error('updateGrade error:', e.message);
  }
}
