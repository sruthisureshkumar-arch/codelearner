import React, { useState, useEffect } from 'react';
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

const s = {
  label:    { display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 },
  input:    { width: '100%', padding: '7px 11px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  mono:     { fontFamily: 'SFMono-Regular, Consolas, monospace', fontSize: 13 },
  btnBlue:  { padding: '7px 16px', background: '#0f6cbf', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  btnGray:  { padding: '7px 16px', background: '#fff', color: '#333', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
  btnDash:  { padding: '7px 16px', background: '#fff', color: '#555', border: '1px dashed #adb5bd', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
  section:  { padding: '14px 20px', borderBottom: '1px solid #f0f0f0' },
  sHead:    { fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
};

/* ── Sidebar ── */
const Sidebar = ({ active, setActive, activeCourse }) => {
  const items = [
    { id: 'questions',   label: 'Assignment questions', icon: '📋' },
    { id: 'create',      label: 'Create question',      icon: '✏️'  },
    { id: 'grades',      label: 'Gradebook',            icon: '📊' },
    { id: 'plagiarism',  label: 'Plagiarism check',     icon: '🔍' },
    { id: 'courses',     label: 'My courses',           icon: '🏫' },
  ];
  return (
    <div style={{ width: 220, background: '#fff', borderRight: '1px solid #dee2e6', minHeight: 'calc(100vh - 52px)', flexShrink: 0 }}>
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
      <div style={{ padding: '6px 16px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8 }}>Active course</div>
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
                Create a course
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Test-case editor (inline, per-question) ── */
const TestCaseEditor = ({ cases, onChange, language }) => {
  const isSql = language === 'sql';
  const add = () => onChange([...cases, { label: '', input: '', appendSql: '', expectedOutput: '' }]);
  const remove = (i) => onChange(cases.filter((_, idx) => idx !== i));
  const update = (i, field, val) => {
    const next = cases.map((c, idx) => idx === i ? { ...c, [field]: val } : c);
    onChange(next);
  };

  return (
    <div>
      {cases.map((tc, i) => (
        <div key={i} style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 4, padding: 12, marginBottom: 10, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Test case {i + 1}</span>
            <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={s.label}>Label <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
            <input value={tc.label} onChange={e => update(i, 'label', e.target.value)} style={s.input} placeholder="e.g. Basic addition" />
          </div>

          {isSql ? (
            // SQL layout: Setup SQL | Append SQL | Expected output (stacked)
            <div>
              <div style={{ marginBottom: 8 }}>
                <label style={s.label}>
                  Setup SQL <span style={{ color: '#888', fontWeight: 400 }}>(runs before student's code — CREATE TABLE, INSERT)</span>
                </label>
                <textarea
                  value={tc.input}
                  onChange={e => update(i, 'input', e.target.value)}
                  style={{ ...s.input, ...s.mono, height: 90, resize: 'vertical' }}
                  placeholder={"e.g.\nCREATE TABLE students (id INTEGER, name TEXT);\nINSERT INTO students VALUES (1,'Alice'),(2,'Bob');"}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={s.label}>
                  Append SQL <span style={{ color: '#888', fontWeight: 400 }}>(runs after student's code — INSERT test data, then SELECT to verify)</span>
                </label>
                <textarea
                  value={tc.appendSql || ''}
                  onChange={e => update(i, 'appendSql', e.target.value)}
                  style={{ ...s.input, ...s.mono, height: 90, resize: 'vertical' }}
                  placeholder={"e.g.\nINSERT INTO employees VALUES (1,'Alice',1),(2,'Bob',2);\nDELETE FROM departments WHERE name='Engineering';\nSELECT e.name, d.name FROM employees e JOIN departments d ON e.dept_id=d.id ORDER BY e.id;"}
                />
              </div>
              <div>
                <label style={s.label}>Expected output</label>
                <textarea
                  value={tc.expectedOutput}
                  onChange={e => update(i, 'expectedOutput', e.target.value)}
                  style={{ ...s.input, ...s.mono, height: 60, resize: 'vertical' }}
                  placeholder={"e.g.\nBob|Marketing\nDavid|HR"}
                />
              </div>
            </div>
          ) : (
            // Default layout for all other languages
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={s.label}>Input</label>
                <textarea
                  value={tc.input}
                  onChange={e => update(i, 'input', e.target.value)}
                  style={{ ...s.input, ...s.mono, height: 72, resize: 'vertical' }}
                  placeholder={"e.g.\n5\n3"}
                />
              </div>
              <div>
                <label style={s.label}>Expected output</label>
                <textarea
                  value={tc.expectedOutput}
                  onChange={e => update(i, 'expectedOutput', e.target.value)}
                  style={{ ...s.input, ...s.mono, height: 72, resize: 'vertical' }}
                  placeholder={"e.g.\n8"}
                />
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={add} style={s.btnDash}>+ Add test case</button>
    </div>
  );
};

/* ── Question card (expanded view with all sections) ── */
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
  { value: 'flex',       label: 'Flex/Lex' },
];

const PLACEHOLDERS = {
  mips:       '# MIPS Assembly starter\n.data\n    # data section\n\n.text\nmain:\n    # your code here\n\n    li $v0, 10\n    syscall',
  c:          '#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}',
  cpp:        '#include <iostream>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}',
  python:     '# Python starter\ndef solution():\n    # your code here\n    pass\n\nif __name__ == "__main__":\n    solution()',
  java:       'public class Solution {\n    public static void main(String[] args) {\n        // your code here\n    }\n}',
  javascript: '// JavaScript starter\nfunction solution() {\n    // your code here\n}\n\nsolution();',
  csharp:     'using System;\n\nclass Solution {\n    static void Main() {\n        // your code here\n    }\n}',
  ruby:       '# Ruby starter\ndef solution\n  # your code here\nend\n\nsolution',
  sql:        '-- SQL starter\nSELECT * FROM table_name\nWHERE condition;',
  flex:       '%option noyywrap\n%%\n/* match pattern  { action } */\n[a-zA-Z]+  { printf("WORD: %s\\n", yytext); }\n[0-9]+     { printf("NUM: %s\\n", yytext); }\n\\n         { /* skip newlines */ }\n.          { /* skip other chars */ }\n%%\nint main() {\n    yylex();\n    return 0;\n}',
};

const QuestionCard = ({ q, index, onUpdate, onToggleVisibility }) => {
  const [tab, setTab] = useState('answer');
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [answerDraft, setAnswerDraft]     = useState(q.answer || '');
  const [placeholder, setPlaceholder]    = useState(q.placeholderCode || '');
  const [language, setLanguage]           = useState(q.language || 'mips');
  const [testCases, setTestCases]         = useState(q.testCases || []);
  const [saving, setSaving]               = useState(false);

  const saveAnswer = async () => {
    if (!answerDraft.trim()) return;
    setSaving(true);
    const res = await axios.post(`/api/questions/${q._id}/answer`, { answer: answerDraft });
    onUpdate(res.data);
    setEditingAnswer(false);
    setSaving(false);
  };

  const savePlaceholder = async () => {
    setSaving(true);
    const res = await axios.put(`/api/questions/${q._id}`, { placeholderCode: placeholder, language });
    onUpdate(res.data);
    setSaving(false);
  };

  const saveTestCases = async () => {
    setSaving(true);
    const res = await axios.put(`/api/questions/${q._id}`, { testCases });
    onUpdate(res.data);
    setSaving(false);
  };

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
      background: tab === id ? '#fff' : '#f8f9fa',
      color: tab === id ? '#0f6cbf' : '#555',
      borderBottom: tab === id ? '2px solid #0f6cbf' : '2px solid transparent',
    }}>{label}</button>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ ...s.section, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0f6cbf', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#333', marginBottom: 4 }}>{q.title}</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{q.description}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: DIFF_COLORS[q.difficulty]?.bg, color: DIFF_COLORS[q.difficulty]?.color }}>
              {q.difficulty}
            </span>
            <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: '#e8f0fb', color: '#0f6cbf' }}>
              {LANGUAGES.find(l => l.value === (q.language || 'mips'))?.label || 'MIPS Assembly'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #dee2e6', background: '#f8f9fa', display: 'flex' }}>
        {tabBtn('answer',      '📝 Answer')}
        {tabBtn('placeholder', '💻 Placeholder code')}
        {tabBtn('testcases',   `🧪 Test cases${q.testCases?.length ? ` (${q.testCases.length})` : ''}`)}
        {tabBtn('submissions', '📋 Submissions')}
      </div>

      {/* Tab: Answer */}
      {tab === 'answer' && (
        <div style={s.section}>
          <div style={s.sHead}>Model answer</div>
          {editingAnswer ? (
            <>
              <textarea
                value={answerDraft}
                onChange={e => setAnswerDraft(e.target.value)}
                style={{ ...s.input, ...s.mono, height: 110, resize: 'vertical', marginBottom: 10 }}
                placeholder="Enter the correct answer or solution..."
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveAnswer} disabled={saving} style={s.btnBlue}>{saving ? 'Saving…' : 'Save answer'}</button>
                <button onClick={() => { setEditingAnswer(false); setAnswerDraft(q.answer || ''); }} style={s.btnGray}>Cancel</button>
              </div>
            </>
          ) : q.answer ? (
            <>
              <div style={{ background: '#f0f7ff', border: '1px solid #cce0ff', borderRadius: 4, padding: '10px 14px', ...s.mono, color: '#333', whiteSpace: 'pre-wrap', marginBottom: 10 }}>
                {q.answer}
              </div>
              <button onClick={() => { setEditingAnswer(true); setAnswerDraft(q.answer); }} style={s.btnGray}>✏️ Edit answer</button>
            </>
          ) : (
            <button onClick={() => setEditingAnswer(true)} style={s.btnDash}>+ Add answer</button>
          )}
        </div>
      )}

      {/* Tab: Placeholder code */}
      {tab === 'placeholder' && (
        <div style={s.section}>
          <div style={s.sHead}>Starter / placeholder code</div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
            This code will be shown to students as the starting point for the question.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Programming language</label>
            <select
              value={language}
              onChange={e => {
                setLanguage(e.target.value);
                if (!placeholder.trim()) setPlaceholder(PLACEHOLDERS[e.target.value] || '');
              }}
              style={{ ...s.input, width: 220 }}
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={s.label}>Placeholder code</label>
            <textarea
              value={placeholder}
              onChange={e => setPlaceholder(e.target.value)}
              style={{ ...s.input, ...s.mono, height: 180, resize: 'vertical' }}
              placeholder={PLACEHOLDERS[language] || '// starter code'}
            />
          </div>
          <button onClick={savePlaceholder} disabled={saving} style={s.btnBlue}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      )}

      {/* Tab: Test cases */}
      {tab === 'testcases' && (
        <div style={s.section}>
          <div style={s.sHead}>Test cases</div>
          <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
            Define inputs and expected outputs to verify student solutions.
          </p>
          <TestCaseEditor cases={testCases} onChange={setTestCases} language={language} />
          {testCases.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <button onClick={saveTestCases} disabled={saving} style={s.btnBlue}>{saving ? 'Saving…' : 'Save test cases'}</button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Submissions */}
      {tab === 'submissions' && (
        <div style={s.section}>
          <SubmissionsPanel questionId={q._id} />
        </div>
      )}

      {/* Visibility toggle — always visible at bottom */}
      <div style={{ padding: '12px 20px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>Student visibility</div>
          <div style={{ fontSize: 12, color: q.isAnswerVisible ? '#155724' : '#888' }}>
            {q.isAnswerVisible ? '✓ Answer visible to students' : 'Answer hidden from students'}
          </div>
        </div>
        <button
          onClick={() => onToggleVisibility(q._id, q.isAnswerVisible)}
          style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', background: q.isAnswerVisible ? '#28a745' : '#ccc', transition: 'background 0.2s' }}
        >
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: q.isAnswerVisible ? 23 : 3, transition: 'left 0.2s' }} />
        </button>
      </div>
    </div>
  );
};

/* ── Per-question submissions panel (sorted by roll number) ── */
const SubmissionsPanel = ({ questionId }) => {
  const [subs, setSubs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/submissions/question/${questionId}`)
      .then(r => setSubs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [questionId]);

  const scoreColor = (score) => score >= 80 ? '#155724' : score >= 50 ? '#856404' : '#721c24';

  if (loading) return <div style={{ textAlign: 'center', padding: 30, color: '#666' }}>Loading submissions…</div>;
  if (!subs.length) return (
    <div style={{ background: '#f8f9fa', borderRadius: 4, padding: 30, textAlign: 'center', color: '#888', fontSize: 13 }}>
      No submissions yet for this question.
    </div>
  );

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
        Showing each student's most recent submission, sorted by roll number.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>Roll No.</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>Student</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>Language</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>Score</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>Attempts</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>Last submitted</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}></th>
          </tr>
        </thead>
        <tbody>
          {subs.map((sub, i) => (
            <React.Fragment key={sub._id}>
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: '#333' }}>{sub.rollNumber || '—'}</td>
                <td style={{ padding: '8px 12px', fontWeight: 500 }}>{sub.studentId}</td>
                <td style={{ padding: '8px 12px', color: '#555' }}>{LANGUAGES.find(l => l.value === sub.language)?.label || sub.language}</td>
                <td style={{ padding: '8px 12px' }}>
                  {sub.totalCases > 0 ? (
                    <span style={{ fontWeight: 600, color: scoreColor(sub.score) }}>{sub.score}% ({sub.totalPassed}/{sub.totalCases})</span>
                  ) : (
                    <span style={{ color: '#888' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '8px 12px', color: '#555' }}>{sub.attempts}</td>
                <td style={{ padding: '8px 12px', color: '#888', fontSize: 12 }}>{new Date(sub.submittedAt).toLocaleString()}</td>
                <td style={{ padding: '8px 12px' }}>
                  <button
                    onClick={() => setExpanded(expanded === sub._id ? null : sub._id)}
                    style={{ ...s.btnGray, padding: '4px 10px', fontSize: 12 }}
                  >
                    {expanded === sub._id ? 'Hide code' : 'View code'}
                  </button>
                </td>
              </tr>
              {expanded === sub._id && (
                <tr style={{ background: '#f9f9ff', borderBottom: '1px solid #f0f0f0' }}>
                  <td colSpan={7} style={{ padding: '10px 12px' }}>
                    <div style={{ background: '#272822', color: '#f8f8f2', borderRadius: 4, padding: 12, ...s.mono, whiteSpace: 'pre-wrap', overflowX: 'auto', marginBottom: sub.testResults?.length ? 10 : 0 }}>
                      {sub.code}
                    </div>
                    {sub.testResults?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {sub.testResults.map((tr, j) => (
                          <span
                            key={j}
                            style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
                              background: tr.passed === true ? '#d4edda' : tr.passed === false ? '#f8d7da' : '#e9ecef',
                              color: tr.passed === true ? '#155724' : tr.passed === false ? '#721c24' : '#555',
                            }}
                          >
                            {tr.label || `Test ${j + 1}`}: {tr.passed === true ? 'Pass' : tr.passed === false ? 'Fail' : 'Ran'}
                          </span>
                        ))}
                      </div>
                    )}
                    {sub.executionError && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#721c24' }}>Error: {sub.executionError}</div>
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ── Gradebook view ── */
const GradebookView = ({ courseId }) => {
  const [grades, setGrades]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/grades/course/${courseId}`)
      .then(r => setGrades(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading gradebook…</div>;
  if (!grades.length) return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#888' }}>
      No submissions yet. Grades appear here once students run their code.
    </div>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', overflow: 'hidden' }}>
      <div style={{ background: '#0f6cbf', padding: '14px 20px' }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>Gradebook — {courseId}</h2>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>Student</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>Questions attempted</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>Overall score</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((g, i) => (
            <React.Fragment key={i}>
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{g.studentId}</td>
                <td style={{ padding: '10px 16px', color: '#555' }}>{g.grades.length}</td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, background: '#e9ecef', borderRadius: 4, height: 8, maxWidth: 120 }}>
                      <div style={{ width: `${g.totalScore}%`, background: g.totalScore >= 80 ? '#28a745' : g.totalScore >= 50 ? '#ffc107' : '#dc3545', height: 8, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontWeight: 600, color: g.totalScore >= 80 ? '#155724' : g.totalScore >= 50 ? '#856404' : '#721c24' }}>{g.totalScore}%</span>
                  </div>
                </td>
              </tr>
              {g.grades.map((qg, j) => (
                <tr key={j} style={{ background: '#f9f9ff', borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '6px 16px 6px 36px', color: '#888', fontSize: 12 }}>↳ {qg.questionTitle}</td>
                  <td style={{ padding: '6px 16px', color: '#888', fontSize: 12 }}>{qg.attempts} attempt{qg.attempts !== 1 ? 's' : ''}</td>
                  <td style={{ padding: '6px 16px', fontSize: 12, fontWeight: 500, color: qg.bestScore >= 80 ? '#155724' : qg.bestScore >= 50 ? '#856404' : '#721c24' }}>{qg.bestScore}%</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ── Plagiarism view ── */
const PlagiarismView = ({ courseId }) => {
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [threshold, setThreshold] = useState(70);

  const run = () => {
    setLoading(true);
    axios.get(`/api/plagiarism/course/${courseId}?threshold=${threshold}`)
      .then(r => setResult(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ background: '#0f6cbf', padding: '14px 20px' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>Plagiarism Detection</h2>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 16px' }}>
            Compares the best submission per student using Jaccard token similarity. Flags pairs above the threshold.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Similarity threshold:</label>
            <input type="number" min={0} max={100} value={threshold} onChange={e => setThreshold(e.target.value)}
              style={{ width: 70, padding: '6px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }} />
            <span style={{ fontSize: 13, color: '#666' }}>%</span>
            <button onClick={run} disabled={loading} style={s.btnBlue}>{loading ? 'Checking…' : 'Run check'}</button>
          </div>
        </div>
      </div>

      {result && (
        result.pairs.length === 0 ? (
          <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 6, padding: 20, color: '#155724', fontSize: 14 }}>
            ✓ No suspicious pairs found above {threshold}% similarity across {result.pairs.length} comparisons.
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#fff3cd', borderBottom: '1px solid #dee2e6', fontSize: 13, color: '#856404', fontWeight: 500 }}>
              ⚠ {result.pairs.length} suspicious pair{result.pairs.length !== 1 ? 's' : ''} found
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Student A</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Student B</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Question</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Similarity</th>
                </tr>
              </thead>
              <tbody>
                {result.pairs.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 16px' }}>{p.studentA}</td>
                    <td style={{ padding: '10px 16px' }}>{p.studentB}</td>
                    <td style={{ padding: '10px 16px', color: '#666', fontSize: 12 }}>{p.questionId}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontWeight: 700, color: p.similarity >= 90 ? '#dc3545' : '#856404' }}>{p.similarity}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

/* ── My Courses view (create + list) ── */
const CoursesView = ({ courses, activeCourseCode, onSwitchCourse, onCoursesChanged, onOpenCourse }) => {
  const [form, setForm]         = useState({ name: '', description: '', password: '', code: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState('');
  const [created, setCreated]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null); // course code being deleted

  const handleDelete = async (code, name) => {
    if (!window.confirm(`Delete "${name}"?\n\nThis will permanently remove the course, all its questions, enrollments, submissions and grades. This cannot be undone.`)) return;
    setDeleting(code);
    try {
      await axios.delete(`/api/courses/${code}`);
      onCoursesChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete course.');
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.password.trim()) {
      setError('Course name and enrollment password are required.');
      return;
    }
    setCreating(true);
    try {
      const res = await axios.post('/api/courses', form);
      setCreated(res.data);
      setForm({ name: '', description: '', password: '', code: '' });
      onCoursesChanged();
      onSwitchCourse(res.data.code);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create course.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#333' }}>Dashboard</h1>
        <button onClick={() => setShowForm(s => !s)} style={s.btnBlue}>{showForm ? 'Cancel' : '+ Create course'}</button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: '#0f6cbf', padding: '14px 20px' }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>Create a new course</h2>
          </div>
          <form onSubmit={handleCreate} style={{ padding: 20 }}>
            {error && (
              <div style={{ background: '#fdf2f2', border: '1px solid #f5c6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#842029' }}>
                {error}
              </div>
            )}
            {created && (
              <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#155724' }}>
                ✓ Course created! Share this code with students so they can enroll: <strong style={{ fontFamily: 'monospace', fontSize: 15 }}>{created.code}</strong>
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Course name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={s.input} placeholder="e.g. CS101 – Intro to MIPS Assembly" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Description <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...s.input, height: 70, resize: 'vertical' }} placeholder="What is this course about?" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Course code <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                style={{ ...s.input, fontFamily: 'monospace', letterSpacing: 1 }}
                placeholder="e.g. MIPS01"
                maxLength={10}
              />
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>4–10 letters/numbers. Leave blank to auto-generate a random code.</div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Enrollment password</label>
              <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={s.input} placeholder="Students will need this to join" />
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>At least 4 characters. Students enter this along with the course code and their roll number.</div>
            </div>
            <button type="submit" disabled={creating} style={s.btnBlue}>{creating ? 'Creating…' : 'Create course'}</button>
          </form>
        </div>
      )}

      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#333' }}>Your courses ({courses.length})</h3>
      {courses.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 30, textAlign: 'center', color: '#888', fontSize: 13 }}>
          You haven't created any courses yet. Click "+ Create course" above to get started.
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
                  {c.studentCount} student{c.studentCount !== 1 ? 's' : ''} enrolled
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activeCourseCode !== c.code && (
                    <button onClick={(e) => { e.stopPropagation(); onSwitchCourse(c.code); }} style={{ ...s.btnGray, flex: 1 }}>Set active</button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); onOpenCourse(c.code); }} style={{ ...s.btnBlue, flex: 1 }}>Open course →</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.code, c.name); }}
                    disabled={deleting === c.code}
                    style={{ ...s.btnGray, flex: 1, background: '#fff', color: '#dc3545', border: '1px solid #dc3545' }}
                  >
                    {deleting === c.code ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main dashboard ── */
const TeacherDashboard = ({ courseId = 'course-001', user, courses = [], activeCourseCode, onCoursesChanged, onSwitchCourse }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [active, setActive]       = useState('courses');
  const [newQ, setNewQ]           = useState({ title: '', description: '', difficulty: 'medium', language: '' });
  const [toast, setToast]         = useState(null);

  useEffect(() => { fetchQuestions(); }, [courseId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/questions/course/${courseId}`);
      setQuestions(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newQ.title.trim() || !newQ.description.trim() || !newQ.language) return;
    try {
      const res = await axios.post('/api/questions', { ...newQ, courseId, createdBy: user?.username || user?.name || 'teacher' });
      setQuestions([res.data, ...questions]);
      setNewQ({ title: '', description: '', difficulty: 'medium', language: '' });
      setActive('questions');
      notify('Question created');
    } catch (e) { console.error(e); }
  };

  const handleUpdate = (updated) => setQuestions(qs => qs.map(q => q._id === updated._id ? updated : q));

  const handleToggleVisibility = async (id, current) => {
    try {
      const res = await axios.patch(`/api/questions/${id}/visibility`, { isAnswerVisible: !current });
      handleUpdate(res.data);
      notify(res.data.isAnswerVisible ? 'Answer visible to students' : 'Answer hidden');
    } catch (e) { console.error(e); }
  };

  const activeCourse = courses.find(c => c.code === activeCourseCode);
  const noActiveCourse = !activeCourse;

  const handleOpenCourse = (code) => {
    onSwitchCourse(code);
    setActive('questions');
  };

  const sectionLabels = {
    create: 'Create question',
    grades: 'Gradebook',
    plagiarism: 'Plagiarism check',
    courses: 'My courses',
    questions: 'Assignment questions',
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 52px)', background: '#f2f2f2' }}>
      <Sidebar active={active} setActive={setActive} activeCourse={activeCourse} />

      <div style={{ flex: 1, padding: 24 }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          <span style={{ color: '#0f6cbf', cursor: 'pointer' }} onClick={() => setActive('courses')}>Dashboard</span>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: '#0f6cbf', cursor: 'pointer' }} onClick={() => setActive('courses')}>{activeCourse ? activeCourse.code : 'No courses yet'}</span>
          <span style={{ margin: '0 6px' }}>›</span>
          <span>{sectionLabels[active] || 'Assignment questions'}</span>
        </div>

        {toast && (
          <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', borderRadius: 4, padding: '10px 16px', marginBottom: 16, fontSize: 14 }}>
            ✓ {toast}
          </div>
        )}

        {['questions', 'create', 'grades', 'plagiarism'].includes(active) && noActiveCourse && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>{sectionLabels[active]}</h1>
            <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>You don't have any courses yet. Create a course to manage its {sectionLabels[active]?.toLowerCase()}.</div>
              <button onClick={() => setActive('courses')} style={s.btnBlue}>Go to Dashboard</button>
            </div>
          </>
        )}

        {/* Create form */}
        {active === 'create' && !noActiveCourse && (
          <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', overflow: 'hidden' }}>
            <div style={{ background: '#0f6cbf', padding: '14px 20px' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>Create new question</h2>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Question title</label>
                <input value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })} style={s.input} placeholder="e.g. Write a MIPS program to add two numbers" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Description / instructions</label>
                <textarea value={newQ.description} onChange={e => setNewQ({ ...newQ, description: e.target.value })} style={{ ...s.input, height: 90, resize: 'vertical' }} placeholder="Describe what students should implement..." />
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Difficulty</label>
                  <select value={newQ.difficulty} onChange={e => setNewQ({ ...newQ, difficulty: e.target.value })} style={{ ...s.input }}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Programming language <span style={{ color: '#dc3545' }}>*</span></label>
                  <select
                    value={newQ.language}
                    onChange={e => setNewQ({ ...newQ, language: e.target.value })}
                    style={{ ...s.input, borderColor: !newQ.language ? '#ffc107' : '#ced4da' }}
                    required
                  >
                    <option value="">— Select a language —</option>
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 18px' }}>
                You can add the answer, placeholder code, and test cases after creating the question.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={s.btnBlue}>Create question</button>
                <button type="button" onClick={() => setActive('questions')} style={s.btnGray}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Questions list */}
        {active === 'questions' && !noActiveCourse && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#333' }}>
                Assignment questions <span style={{ fontSize: 15, fontWeight: 400, color: '#888' }}>({questions.length})</span>
              </h1>
              <button onClick={() => setActive('create')} style={s.btnBlue}>+ Add question</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading...</div>
            ) : questions.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#666' }}>
                No questions yet.{' '}
                <button onClick={() => setActive('create')} style={{ color: '#0f6cbf', background: 'none', border: 'none', cursor: 'pointer' }}>Create the first one.</button>
              </div>
            ) : (
              questions.map((q, i) => (
                <QuestionCard
                  key={q._id}
                  q={q}
                  index={i}
                  onUpdate={handleUpdate}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))
            )}
          </>
        )}

        {active === 'grades' && !noActiveCourse && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>Gradebook</h1>
            <GradebookView courseId={courseId} />
          </>
        )}

        {active === 'plagiarism' && !noActiveCourse && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>Plagiarism Check</h1>
            <PlagiarismView courseId={courseId} />
          </>
        )}

        {active === 'courses' && (
          <>
            <CoursesView
              courses={courses}
              activeCourseCode={activeCourseCode}
              onSwitchCourse={onSwitchCourse}
              onCoursesChanged={onCoursesChanged}
              onOpenCourse={handleOpenCourse}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
