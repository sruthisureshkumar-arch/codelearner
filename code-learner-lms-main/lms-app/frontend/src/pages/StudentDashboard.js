import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const DIFF_COLORS = {
  easy:   { bg: '#d4edda', color: '#155724' },
  medium: { bg: '#fff3cd', color: '#856404' },
  hard:   { bg: '#f8d7da', color: '#721c24' },
};

/* Moodle-style course "tile" banners — repeating geometric patterns in a few palettes */
const COURSE_PATTERNS = [
  'repeating-linear-gradient(45deg, #f0ad4e 0, #f0ad4e 18px, #f7c781 18px, #f7c781 36px)',
  'repeating-linear-gradient(45deg, #2f80c9 0, #2f80c9 22px, #5b9bdb 22px, #5b9bdb 44px)',
  'repeating-linear-gradient(135deg, #1ba98c 0, #1ba98c 22px, #3fc4a7 22px, #3fc4a7 44px)',
  'repeating-linear-gradient(45deg, #8e6fcf 0, #8e6fcf 18px, #ab95dd 18px, #ab95dd 36px)',
  'repeating-linear-gradient(135deg, #e0566f 0, #e0566f 18px, #ea8898 18px, #ea8898 36px)',
];

const LANGUAGES = [
  { value: 'mips',       label: 'MIPS Assembly' },
  { value: 'c',          label: 'C' },
  { value: 'cpp',        label: 'C++' },
  { value: 'python',     label: 'Python' },
  { value: 'java',       label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'csharp',     label: 'C#' },
  { value: 'ruby',       label: 'Ruby' },
  { value: 'sql',        label: 'SQL' },
];

const LANG_LABEL = Object.fromEntries(LANGUAGES.map(l => [l.value, l.label]));

const PLACEHOLDERS = {
  mips:       '# MIPS Assembly\n.data\n    # data section\n\n.text\nmain:\n    # your code here\n\n    li $v0, 10\n    syscall',
  c:          '#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}',
  cpp:        '#include <iostream>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}',
  python:     '# Python\ndef solution():\n    # your code here\n    pass\n\nsolution()',
  java:       'public class Solution {\n    public static void main(String[] args) {\n        // your code here\n    }\n}',
  javascript: 'function solution() {\n    // your code here\n}\n\nsolution();',
  csharp:     'using System;\n\nclass Solution {\n    static void Main() {\n        // your code here\n    }\n}',
  ruby:       'def solution\n  # your code here\nend\n\nsolution',
};

const s = {
  input:   { width: '100%', padding: '7px 11px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  mono:    { fontFamily: 'SFMono-Regular, Consolas, monospace', fontSize: 12 },
  btnBlue: { padding: '7px 16px', background: '#0f6cbf', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  btnGray: { padding: '7px 16px', background: '#fff', color: '#333', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
};

/* ── Per-question code editor + Run button ── */
const CodeEditor = ({ question, studentId, courseId }) => {
  const [lang, setLang]         = useState(question.language || '');
  const [code, setCode]         = useState('');
  const [running, setRunning]   = useState(false);
  const [result, setResult]     = useState(null);
  const [revealed, setRevealed] = useState(false);

  const handleLangChange = (val) => {
    setLang(val);
    if (!code.trim()) {
      setCode((val === question.language && question.placeholderCode)
        ? question.placeholderCode
        : (PLACEHOLDERS[val] || ''));
    }
  };

  const runCode = async () => {
    if (!lang) { alert('Please select a language first.'); return; }
    if (!code.trim()) { alert('Please write some code first.'); return; }
    setRunning(true);
    setResult(null);
    try {
      const res = await axios.post('/api/submissions', {
        questionId: question._id,
        courseId,
        studentId,
        language: lang,
        code,
      });
      setResult(res.data);
    } catch (e) {
      setResult({ executionError: e.response?.data?.error || e.message, testResults: [] });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0' }}>
      {/* Language + Run */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Your code</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: '#666' }}>Language:</label>
          <select
            value={lang}
            onChange={e => handleLangChange(e.target.value)}
            style={{ ...s.input, width: 170, padding: '4px 8px', fontSize: 12 }}
          >
            <option value="">— Choose language —</option>
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <button
            onClick={runCode}
            disabled={running || !lang || !code.trim()}
            style={{ ...s.btnBlue, padding: '5px 16px', fontSize: 12, opacity: (running || !lang || !code.trim()) ? 0.6 : 1 }}
          >
            {running ? '⏳ Running…' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* Code textarea */}
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder={lang ? (PLACEHOLDERS[lang] || '// start coding here') : '// select a language above to start coding'}
        style={{
          ...s.input, ...s.mono,
          height: 160, resize: 'vertical',
          background: '#1e1e2e', color: '#cdd6f4',
          border: '1px solid #313244', borderRadius: 4,
          padding: '10px 12px',
        }}
      />
      {!lang && <div style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>Choose a language to get a starter template.</div>}

      {/* Test results */}
      {result && (
        <div style={{ marginTop: 14 }}>
          {result.executionError && (
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '10px 14px', marginBottom: 10, fontSize: 13 }}>
              <strong>⚠ Execution error:</strong>
              <pre style={{ ...s.mono, margin: '6px 0 0', whiteSpace: 'pre-wrap', color: '#856404' }}>{result.executionError}</pre>
            </div>
          )}
          {result.testResults && result.testResults.length > 0 && (
            <div>
              {result.totalCases > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Test results</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: result.score >= 80 ? '#155724' : result.score >= 50 ? '#856404' : '#721c24' }}>
                    {result.totalPassed}/{result.totalCases} passed — {result.score}%
                  </span>
                </div>
              )}
              {result.testResults.map((tr, i) => {
                // tr.passed === null means there's no expected output to compare
                // against (no test cases configured) — show output, no verdict.
                const isVerdict = tr.passed !== null && tr.passed !== undefined;
                const borderColor = !isVerdict ? '#dee2e6' : (tr.passed ? '#c3e6cb' : '#f5c6cb');
                const bg = !isVerdict ? '#f8f9fa' : (tr.passed ? '#f0fff4' : '#fff5f5');
                return (
                <div key={i} style={{
                  border: `1px solid ${borderColor}`,
                  background: bg,
                  borderRadius: 4, padding: '10px 14px', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{tr.label || `Test ${i + 1}`}</span>
                    {isVerdict && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: tr.passed ? '#155724' : '#721c24' }}>
                        {tr.passed ? '✓ Passed' : '✗ Failed'}
                      </span>
                    )}
                  </div>
                  {!isVerdict && (
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                      This question has no test cases, so this output isn't graded — add expected output as a teacher to check correctness.
                    </div>
                  )}
                  {!tr.isHidden && (
                    <div style={{ display: 'grid', gridTemplateColumns: isVerdict ? '1fr 1fr' : '1fr', gap: 8, fontSize: 12 }}>
                      {isVerdict && (
                        <>
                          <div>
                            <div style={{ color: '#888', marginBottom: 2 }}>Input</div>
                            <pre style={{ ...s.mono, background: '#f8f9fa', padding: '6px 8px', borderRadius: 3, margin: 0, whiteSpace: 'pre-wrap' }}>{tr.input || '(none)'}</pre>
                          </div>
                          <div>
                            <div style={{ color: '#888', marginBottom: 2 }}>Expected</div>
                            <pre style={{ ...s.mono, background: '#f8f9fa', padding: '6px 8px', borderRadius: 3, margin: 0, whiteSpace: 'pre-wrap' }}>{tr.expectedOutput || '(any)'}</pre>
                          </div>
                        </>
                      )}
                      <div style={{ gridColumn: isVerdict ? '1 / -1' : 'auto' }}>
                        <div style={{ color: '#888', marginBottom: 2 }}>Your output</div>
                        <pre style={{
                          ...s.mono,
                          background: !isVerdict ? '#f8f9fa' : (tr.passed ? '#f0fff4' : '#fff0f0'),
                          padding: '6px 8px', borderRadius: 3, margin: 0, whiteSpace: 'pre-wrap',
                          color: !isVerdict ? '#333' : (tr.passed ? '#155724' : '#721c24'),
                        }}>{tr.actualOutput || '(no output)'}</pre>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Answer reveal */}
      {question.isAnswerVisible && question.answer && (
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setRevealed(r => !r)} style={{ ...s.btnGray, fontSize: 12, padding: '5px 12px' }}>
            {revealed ? '▲ Hide answer' : '▼ Show teacher answer'}
          </button>
          {revealed && (
            <div style={{ marginTop: 8, background: '#f0fff4', border: '1px solid #c3e6cb', borderRadius: 4, padding: '12px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#155724', marginBottom: 6 }}>✓ Teacher's answer</div>
              <pre style={{ ...s.mono, margin: 0, color: '#333', whiteSpace: 'pre-wrap' }}>{question.answer}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Submission history tab ── */
const HistoryView = ({ studentId, courseId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/submissions/student/${studentId}?courseId=${courseId}`)
      .then(r => setHistory(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId, courseId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading history…</div>;
  if (!history.length) return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#888' }}>
      No submissions yet. Run your code on a question to see history here.
    </div>
  );

  return (
    <div>
      {history.map((sub, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
            <div>
              <span style={{ fontWeight: 500, fontSize: 14, color: '#333' }}>{sub.questionId?.title || 'Question'}</span>
              <span style={{ marginLeft: 10, fontSize: 12, padding: '2px 8px', borderRadius: 10, background: '#e8f0fb', color: '#0f6cbf' }}>
                {LANG_LABEL[sub.language] || sub.language}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: sub.score >= 80 ? '#155724' : sub.score >= 50 ? '#856404' : '#721c24' }}>{sub.score}%</div>
              <div style={{ fontSize: 11, color: '#999' }}>{new Date(sub.submittedAt).toLocaleString()}</div>
            </div>
          </div>
          <div style={{ padding: '8px 16px', fontSize: 12, color: '#666' }}>
            {sub.totalPassed}/{sub.totalCases} test cases passed
            {sub.executionError && <span style={{ color: '#dc3545', marginLeft: 12 }}>⚠ {sub.executionError}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── My grades tab ── */
const MyGrades = ({ studentId, courseId }) => {
  const [grade, setGrade]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/grades/student/${studentId}?courseId=${courseId}`)
      .then(r => setGrade(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId, courseId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading grades…</div>;
  if (!grade || !grade.grades || grade.grades.length === 0) return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#888' }}>
      No grades yet. Run your code to earn scores.
    </div>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', overflow: 'hidden' }}>
      <div style={{ background: '#0f6cbf', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>My Grades</h2>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>{grade.totalScore}%</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Question</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Attempts</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Best score</th>
          </tr>
        </thead>
        <tbody>
          {grade.grades.map((g, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '10px 16px' }}>{g.questionTitle}</td>
              <td style={{ padding: '10px 16px', color: '#555' }}>{g.attempts}</td>
              <td style={{ padding: '10px 16px', fontWeight: 600, color: g.bestScore >= 80 ? '#155724' : g.bestScore >= 50 ? '#856404' : '#721c24' }}>{g.bestScore}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ── Sidebar ── */
const Sidebar = ({ active, setActive, studentName, activeCourse }) => {
  const items = [
    { id: 'questions', label: 'Course questions', icon: '📋' },
    { id: 'history',   label: 'My submissions',   icon: '📁' },
    { id: 'grades',    label: 'My grades',         icon: '📊' },
    { id: 'courses',   label: 'My courses',        icon: '🏫' },
  ];
  return (
    <div style={{ width: 220, background: 'white', borderRight: '1px solid #dee2e6', minHeight: 'calc(100vh - 52px)', flexShrink: 0 }}>
      <div style={{ padding: '16px 16px 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8 }}>Navigation</div>
      {items.map(item => (
        <button key={item.id} onClick={() => setActive(item.id)} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px',
          background: active === item.id ? '#e8f0fb' : 'transparent',
          borderLeft: active === item.id ? '4px solid #0f6cbf' : '4px solid transparent',
          border: 'none', cursor: 'pointer', fontSize: 14,
          color: active === item.id ? '#0f6cbf' : '#333',
          fontWeight: active === item.id ? 500 : 400, textAlign: 'left',
        }}>
          <span>{item.icon}</span>{item.label}
        </button>
      ))}
      <div style={{ margin: '12px 12px', borderTop: '1px solid #dee2e6' }} />
      <div style={{ padding: '6px 16px 6px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8 }}>Active course</div>
      <div style={{ padding: '8px 16px', fontSize: 13, color: '#555' }}>
        {activeCourse ? (
          <>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>{activeCourse.code}</div>
            <div style={{ color: '#888', fontSize: 12 }}>{activeCourse.name}</div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>No courses yet</div>
            <div style={{ color: '#888', fontSize: 12 }}>
              <button onClick={() => setActive('courses')} style={{ background: 'none', border: 'none', color: '#0f6cbf', cursor: 'pointer', padding: 0, fontSize: 12 }}>
                Join a course
              </button>
            </div>
          </>
        )}
      </div>
      <div style={{ margin: '12px 12px', borderTop: '1px solid #dee2e6' }} />
      <div style={{ padding: '8px 16px' }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Logged in as</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{studentName}</div>
      </div>
    </div>
  );
};

/* ── Course access gate (re-check roll number + password) ── */
const CourseAccessGate = ({ course, defaultRollNumber, onUnlock }) => {
  const [password, setPassword]   = useState('');
  const [rollNumber, setRollNumber] = useState(defaultRollNumber || '');
  const [error, setError]         = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password.trim() || !rollNumber.trim()) {
      setError('Roll number and course password are required.');
      return;
    }
    setVerifying(true);
    try {
      await axios.post('/api/courses/verify', {
        code: course.code,
        password,
        rollNumber: rollNumber.trim(),
      });
      onUnlock(course.code);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not verify access.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', maxWidth: 440, overflow: 'hidden' }}>
      <div style={{ background: '#0f6cbf', padding: '14px 20px' }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>🔒 {course.code} – {course.name}</h2>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: 20 }}>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
          Enter your roll number and this course's password to access its questions, submissions and grades.
        </p>
        {error && (
          <div style={{ background: '#fdf2f2', border: '1px solid #f5c6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#842029' }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 }}>Roll number</label>
          <input
            value={rollNumber}
            onChange={e => setRollNumber(e.target.value)}
            style={s.input}
            placeholder="e.g. 21CS045"
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 }}>Course password</label>
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={s.input}
            placeholder="Given by your teacher"
          />
        </div>
        <button type="submit" disabled={verifying} style={s.btnBlue}>{verifying ? 'Verifying…' : 'Unlock course'}</button>
      </form>
    </div>
  );
};

/* ── My Courses view (enroll + list) ── */
const StudentCoursesView = ({ courses, activeCourseCode, onSwitchCourse, onCoursesChanged, onOpenCourse, defaultRollNumber }) => {
  const [form, setForm]         = useState({ code: '', password: '', rollNumber: defaultRollNumber || '' });
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleEnroll = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.code.trim() || !form.password.trim() || !form.rollNumber.trim()) {
      setError('Course code, password and roll number are required.');
      return;
    }
    setEnrolling(true);
    try {
      const res = await axios.post('/api/courses/enroll', {
        code: form.code.trim().toUpperCase(),
        password: form.password,
        rollNumber: form.rollNumber.trim(),
      });
      setSuccess(`✓ Enrolled in ${res.data.course.name} (${res.data.course.code})`);
      setForm({ code: '', password: '', rollNumber: form.rollNumber });
      onCoursesChanged();
      onSwitchCourse(res.data.course.code);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not enroll in course.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#333' }}>Dashboard</h1>
        <button onClick={() => setShowForm(s => !s)} style={s.btnBlue}>{showForm ? 'Cancel' : '+ Join a course'}</button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: '#0f6cbf', padding: '14px 20px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>Enroll in a course</h2>
          </div>
          <form onSubmit={handleEnroll} style={{ padding: 20 }}>
            {error && (
              <div style={{ background: '#fdf2f2', border: '1px solid #f5c6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#842029' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#155724' }}>
                {success}
              </div>
            )}
            <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 }}>Course code</label>
                <input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  style={{ ...s.input, fontFamily: 'monospace', letterSpacing: 1 }}
                  placeholder="e.g. AB12CD"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 }}>Course password</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={s.input}
                  placeholder="Given by your teacher"
                />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 }}>Roll number</label>
              <input
                value={form.rollNumber}
                onChange={e => setForm({ ...form, rollNumber: e.target.value })}
                style={s.input}
                placeholder="e.g. 21CS045"
              />
            </div>
            <button type="submit" disabled={enrolling} style={s.btnBlue}>{enrolling ? 'Enrolling…' : 'Enroll'}</button>
          </form>
        </div>
      )}

      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#333' }}>Your courses ({courses.length})</h3>
      {courses.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 30, textAlign: 'center', color: '#888', fontSize: 13 }}>
          You're not enrolled in any courses yet. Click "+ Join a course" above and enter the code from your teacher.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {courses.map((c, i) => (
            <div
              key={c.code}
              onClick={() => onOpenCourse(c.code)}
              style={{ background: '#fff', borderRadius: 8, border: '1px solid #dee2e6', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow .15s, transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ height: 80, background: COURSE_PATTERNS[i % COURSE_PATTERNS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace', textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>{c.code}</span>
              </div>
              <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 6 }}>
                  {c.name}
                  {activeCourseCode === c.code && (
                    <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#e8f0fb', color: '#0f6cbf', fontWeight: 600 }}>ACTIVE</span>
                  )}
                </div>
                {c.description && <div style={{ fontSize: 12, color: '#888', marginBottom: 10, flex: 1 }}>{c.description}</div>}
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                  Roll number: {c.rollNumber}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {activeCourseCode !== c.code && (
                    <button onClick={(e) => { e.stopPropagation(); onSwitchCourse(c.code); }} style={{ ...s.btnGray, flex: 1 }}>Set active</button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); onOpenCourse(c.code); }} style={{ ...s.btnBlue, flex: 1 }}>Open course →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main Dashboard ── */
const StudentDashboard = ({ courseId = 'course-001', user, courses = [], activeCourseCode, onCoursesChanged, onSwitchCourse }) => {
  const studentId = user?.name || '';
  const [questions, setQuestions]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeSection, setActiveSection] = useState('courses');
  const [unlockedCourses, setUnlockedCourses] = useState(new Set());

  const activeCourse = courses.find(c => c.code === activeCourseCode);
  const isLocked = !!activeCourse && !unlockedCourses.has(activeCourse.code);
  const noActiveCourse = !activeCourse;

  const handleOpenCourse = (code) => {
    onSwitchCourse(code);
    setActiveSection('questions');
  };

  const handleUnlock = (code) => {
    setUnlockedCourses(prev => new Set(prev).add(code));
  };

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/questions/course/${courseId}`);
      setQuestions(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { if (studentId) fetchQuestions(); }, [studentId, fetchQuestions]);

  const sectionLabels = {
    history: 'My submissions',
    grades: 'My grades',
    courses: 'My courses',
    questions: 'Course questions',
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 52px)', background: '#f2f2f2' }}>
      <Sidebar
        active={activeSection}
        setActive={setActiveSection}
        studentName={studentId}
        activeCourse={activeCourse}
      />

      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          <span style={{ color: '#0f6cbf', cursor: 'pointer' }} onClick={() => setActiveSection('courses')}>Dashboard</span>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: '#0f6cbf', cursor: 'pointer' }} onClick={() => setActiveSection('courses')}>{activeCourse ? activeCourse.code : 'No courses yet'}</span>
          <span style={{ margin: '0 6px' }}>›</span>
          <span>{sectionLabels[activeSection] || 'Course questions'}</span>
        </div>

        {['questions', 'history', 'grades'].includes(activeSection) && noActiveCourse && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>{sectionLabels[activeSection]}</h1>
            <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>You haven't joined any courses yet. Join a course to see its {sectionLabels[activeSection]?.toLowerCase()}.</div>
              <button onClick={() => setActiveSection('courses')} style={s.btnBlue}>Go to Dashboard</button>
            </div>
          </>
        )}

        {['questions', 'history', 'grades'].includes(activeSection) && !noActiveCourse && isLocked && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>{sectionLabels[activeSection]}</h1>
            <CourseAccessGate course={activeCourse} defaultRollNumber={activeCourse.rollNumber || user?.rollNumber || ''} onUnlock={handleUnlock} />
          </>
        )}

        {activeSection === 'questions' && !noActiveCourse && !isLocked && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>Course questions</h1>
            <div style={{ background: 'white', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ background: '#0f6cbf', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>💻</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>
                    {activeCourse ? `${activeCourse.code} – ${activeCourse.name}` : 'No course selected'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Choose your language per question. Click Run to check your solution against test cases.</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading questions...</div>
            ) : questions.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#666' }}>
                No questions have been posted yet.
              </div>
            ) : (
              questions.map((q, i) => (
                <div key={q._id} style={{ background: 'white', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0f6cbf', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: '#333', marginBottom: 4 }}>{q.title}</div>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{q.description}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: DIFF_COLORS[q.difficulty]?.bg || '#eee', color: DIFF_COLORS[q.difficulty]?.color || '#333' }}>
                          {q.difficulty}
                        </span>
                        {q.language && (
                          <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: '#e8f0fb', color: '#0f6cbf' }}>
                            {LANG_LABEL[q.language] || q.language}
                          </span>
                        )}
                        {q.testCases && q.testCases.length > 0 && (
                          <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: '#e8f8f5', color: '#0d9488' }}>
                            {q.testCases.length} test case{q.testCases.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <CodeEditor question={q} studentId={studentId} courseId={courseId} />
                </div>
              ))
            )}
          </>
        )}

        {activeSection === 'history' && !noActiveCourse && !isLocked && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>My Submissions</h1>
            <HistoryView studentId={studentId} courseId={courseId} />
          </>
        )}

        {activeSection === 'grades' && !noActiveCourse && !isLocked && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>My Grades</h1>
            <MyGrades studentId={studentId} courseId={courseId} />
          </>
        )}

        {activeSection === 'courses' && (
          <>
            <StudentCoursesView
              courses={courses}
              activeCourseCode={activeCourseCode}
              onSwitchCourse={onSwitchCourse}
              onCoursesChanged={onCoursesChanged}
              onOpenCourse={handleOpenCourse}
              defaultRollNumber={user?.rollNumber || ''}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
