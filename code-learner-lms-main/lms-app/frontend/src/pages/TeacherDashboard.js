import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const DIFF_COLORS = {
  easy:   { bg: '#d4edda', color: '#155724' },
  medium: { bg: '#fff3cd', color: '#856404' },
  hard:   { bg: '#f8d7da', color: '#721c24' },
};

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
  btnRed:   { padding: '7px 16px', background: '#fff', color: '#dc3545', border: '1px solid #dc3545', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
  section:  { padding: '14px 20px', borderBottom: '1px solid #f0f0f0' },
  sHead:    { fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
};

/* ── Language list ── */
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
  java:       'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your code here\n    }\n}',
  javascript: '// JavaScript starter\nfunction solution() {\n    // your code here\n}\n\nsolution();',
  csharp:     'using System;\n\nclass Solution {\n    static void Main() {\n        // your code here\n    }\n}',
  ruby:       '# Ruby starter\ndef solution\n  # your code here\nend\n\nsolution',
  sql:        '-- SQL starter\nSELECT * FROM table_name\nWHERE condition;',
  flex:       '%option noyywrap\n%%\n/* match pattern  { action } */\n[a-zA-Z]+  { printf("WORD: %s\\n", yytext); }\n[0-9]+     { printf("NUM: %s\\n", yytext); }\n\\n         { /* skip newlines */ }\n.          { /* skip other chars */ }\n%%\nint main() {\n    yylex();\n    return 0;\n}',
};

/* ── Sidebar ── */
const Sidebar = ({ active, setActive, activeCourse }) => {
  const items = [
    { id: 'sessions',    label: 'Sessions',          icon: '📚' },
    { id: 'grades',      label: 'Gradebook',          icon: '📊' },
    { id: 'plagiarism',  label: 'Plagiarism check',   icon: '🔍' },
    { id: 'courses',     label: 'My courses',          icon: '🏫' },
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
            <div>
              <div style={{ marginBottom: 8 }}>
                <label style={s.label}>Setup SQL <span style={{ color: '#888', fontWeight: 400 }}>(runs before student's code)</span></label>
                <textarea value={tc.input} onChange={e => update(i, 'input', e.target.value)} style={{ ...s.input, ...s.mono, height: 90, resize: 'vertical' }} placeholder="CREATE TABLE ...; INSERT INTO ...;" />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={s.label}>Append SQL <span style={{ color: '#888', fontWeight: 400 }}>(runs after student's code)</span></label>
                <textarea value={tc.appendSql || ''} onChange={e => update(i, 'appendSql', e.target.value)} style={{ ...s.input, ...s.mono, height: 90, resize: 'vertical' }} placeholder="SELECT ... FROM ...;" />
              </div>
              <div>
                <label style={s.label}>Expected output</label>
                <textarea value={tc.expectedOutput} onChange={e => update(i, 'expectedOutput', e.target.value)} style={{ ...s.input, ...s.mono, height: 60, resize: 'vertical' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={s.label}>Input</label>
                <textarea value={tc.input} onChange={e => update(i, 'input', e.target.value)} style={{ ...s.input, ...s.mono, height: 72, resize: 'vertical' }} />
              </div>
              <div>
                <label style={s.label}>Expected output</label>
                <textarea value={tc.expectedOutput} onChange={e => update(i, 'expectedOutput', e.target.value)} style={{ ...s.input, ...s.mono, height: 72, resize: 'vertical' }} />
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={add} style={s.btnDash}>+ Add test case</button>
    </div>
  );
};

/* ── Per-question submissions panel ── */
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
  if (loading) return <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>Loading submissions…</div>;
  if (!subs.length) return <div style={{ padding: 30, textAlign: 'center', color: '#888', fontSize: 13, background: '#f8f9fa', borderRadius: 4 }}>No submissions yet.</div>;

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>Each student's most recent submission, sorted by roll number.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            {['Roll No.','Student','Language','Score','Attempts','Last submitted',''].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subs.map((sub, i) => (
            <React.Fragment key={sub._id}>
              <tr style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600 }}>{sub.rollNumber || '—'}</td>
                <td style={{ padding: '8px 12px', fontWeight: 500 }}>{sub.studentId}</td>
                <td style={{ padding: '8px 12px', color: '#555' }}>{LANGUAGES.find(l => l.value === sub.language)?.label || sub.language}</td>
                <td style={{ padding: '8px 12px' }}>
                  {sub.totalCases > 0 ? <span style={{ fontWeight: 600, color: scoreColor(sub.score) }}>{sub.score}% ({sub.totalPassed}/{sub.totalCases})</span> : <span style={{ color: '#888' }}>—</span>}
                </td>
                <td style={{ padding: '8px 12px', color: '#555' }}>{sub.attempts}</td>
                <td style={{ padding: '8px 12px', color: '#888', fontSize: 12 }}>{new Date(sub.submittedAt).toLocaleString()}</td>
                <td style={{ padding: '8px 12px' }}>
                  <button onClick={() => setExpanded(expanded === sub._id ? null : sub._id)} style={{ ...s.btnGray, padding: '4px 10px', fontSize: 12 }}>
                    {expanded === sub._id ? 'Hide' : 'Code'}
                  </button>
                </td>
              </tr>
              {expanded === sub._id && (
                <tr style={{ background: '#f9f9ff', borderBottom: '1px solid #f0f0f0' }}>
                  <td colSpan={7} style={{ padding: '10px 12px' }}>
                    <div style={{ background: '#272822', color: '#f8f8f2', borderRadius: 4, padding: 12, ...s.mono, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{sub.code}</div>
                    {sub.testResults?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {sub.testResults.map((tr, j) => (
                          <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500, background: tr.passed ? '#d4edda' : '#f8d7da', color: tr.passed ? '#155724' : '#721c24' }}>
                            {tr.label || `Test ${j+1}`}: {tr.passed ? 'Pass' : 'Fail'}
                          </span>
                        ))}
                      </div>
                    )}
                    {sub.executionError && <div style={{ marginTop: 8, fontSize: 12, color: '#721c24' }}>Error: {sub.executionError}</div>}
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

/* ── Question card ── */
const QuestionCard = ({ q, index, onUpdate, onToggleVisibility, onRemove, sessionId }) => {
  const [tab, setTab]               = useState('answer');
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [answerDraft, setAnswerDraft]     = useState(q.answer || '');
  const [placeholder, setPlaceholder]    = useState(q.placeholderCode || '');
  const [language, setLanguage]           = useState(q.language || 'mips');
  const [testCases, setTestCases]         = useState(q.testCases || []);
  const [hideTests, setHideTests]         = useState(!!q.hideTestCases);
  const [saving, setSaving]               = useState(false);
  const [aiLoading, setAiLoading]         = useState(false);

  const saveAnswer = async () => {
    if (!answerDraft.trim()) return;
    setSaving(true);
    try {
      const res = await axios.post(`/api/questions/${q._id}/answer`, { answer: answerDraft });
      if (res.data?.answer) onUpdate({ ...q, ...res.data });
      setEditingAnswer(false);
    } catch(e){ console.error(e); } finally { setSaving(false); }
  };

  const savePlaceholder = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`/api/questions/${q._id}`, { placeholderCode: placeholder, language });
      onUpdate({ ...q, ...res.data });
    } catch(e){ console.error(e); } finally { setSaving(false); }
  };

  const saveTestCases = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`/api/questions/${q._id}`, { testCases, hideTestCases: hideTests });
      onUpdate({ ...q, ...res.data });
    } catch(e){ console.error(e); } finally { setSaving(false); }
  };

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const res = await axios.post(`/api/questions/${q._id}/generate-placeholder`, { language });
      const generated = res.data?.placeholderCode || '';
      setPlaceholder(generated);
      onUpdate({ ...q, placeholderCode: generated, language });
    } catch(e){ console.error(e); alert('AI generation failed.'); } finally { setAiLoading(false); }
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
      <div style={{ ...s.section, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0f6cbf', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#333', marginBottom: 4 }}>{q.title}</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{q.description}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: DIFF_COLORS[q.difficulty]?.bg, color: DIFF_COLORS[q.difficulty]?.color }}>{q.difficulty}</span>
            <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: '#e8f0fb', color: '#0f6cbf' }}>{LANGUAGES.find(l => l.value === q.language)?.label || q.language}</span>
            {q.hideTestCases && <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: '#fff3cd', color: '#856404' }}>Test cases hidden</span>}
          </div>
        </div>
        {onRemove && (
          <button onClick={() => { if(window.confirm('Remove this question from the session?')) onRemove(q._id); }} style={{ ...s.btnRed, padding: '4px 10px', fontSize: 12, flexShrink: 0 }}>Remove</button>
        )}
      </div>

      <div style={{ borderBottom: '1px solid #dee2e6', background: '#f8f9fa', display: 'flex' }}>
        {tabBtn('answer',      '📝 Answer')}
        {tabBtn('placeholder', '💻 Placeholder code')}
        {tabBtn('testcases',   `🧪 Test cases${q.testCases?.length ? ` (${q.testCases.length})` : ''}`)}
        {tabBtn('submissions', '📋 Submissions')}
      </div>

      {tab === 'answer' && (
        <div style={s.section}>
          <div style={s.sHead}>Model answer</div>
          {editingAnswer ? (
            <>
              <textarea value={answerDraft} onChange={e => setAnswerDraft(e.target.value)} style={{ ...s.input, ...s.mono, height: 110, resize: 'vertical', marginBottom: 10 }} placeholder="Enter the correct answer..." />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveAnswer} disabled={saving} style={s.btnBlue}>{saving ? 'Saving…' : 'Save answer'}</button>
                <button onClick={() => { setEditingAnswer(false); setAnswerDraft(q.answer || ''); }} style={s.btnGray}>Cancel</button>
              </div>
            </>
          ) : q.answer ? (
            <>
              <div style={{ background: '#f0f7ff', border: '1px solid #cce0ff', borderRadius: 4, padding: '10px 14px', ...s.mono, color: '#333', whiteSpace: 'pre-wrap', marginBottom: 10 }}>{q.answer}</div>
              <button onClick={() => { setEditingAnswer(true); setAnswerDraft(q.answer); }} style={s.btnGray}>✏️ Edit answer</button>
            </>
          ) : (
            <button onClick={() => setEditingAnswer(true)} style={s.btnDash}>+ Add answer</button>
          )}
        </div>
      )}

      {tab === 'placeholder' && (
        <div style={s.section}>
          <div style={s.sHead}>Starter / placeholder code</div>
          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Programming language</label>
            <select value={language} onChange={e => { setLanguage(e.target.value); if (!placeholder.trim()) setPlaceholder(PLACEHOLDERS[e.target.value] || ''); }} style={{ ...s.input, width: 220 }}>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ ...s.label, marginBottom: 0 }}>Placeholder code</label>
              <button onClick={generateAI} disabled={aiLoading} style={{ ...s.btnGray, padding: '4px 10px', fontSize: 12 }}>
                {aiLoading ? '⏳ Generating…' : '✨ Generate with AI'}
              </button>
            </div>
            <textarea value={placeholder} onChange={e => setPlaceholder(e.target.value)} style={{ ...s.input, ...s.mono, height: 180, resize: 'vertical' }} placeholder={PLACEHOLDERS[language] || '// starter code'} />
          </div>
          <button onClick={savePlaceholder} disabled={saving} style={s.btnBlue}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      )}

      {tab === 'testcases' && (
        <div style={s.section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={s.sHead}>Test cases</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#555' }}>
              <div
                onClick={() => setHideTests(v => !v)}
                style={{ width: 40, height: 22, borderRadius: 11, background: hideTests ? '#0f6cbf' : '#ccc', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: hideTests ? 20 : 2, transition: 'left 0.2s' }} />
              </div>
              Hide test cases from students
            </label>
          </div>
          <TestCaseEditor cases={testCases} onChange={setTestCases} language={language} />
          {(testCases.length > 0) && (
            <div style={{ marginTop: 14 }}>
              <button onClick={saveTestCases} disabled={saving} style={s.btnBlue}>{saving ? 'Saving…' : 'Save test cases'}</button>
            </div>
          )}
        </div>
      )}

      {tab === 'submissions' && (
        <div style={s.section}><SubmissionsPanel questionId={q._id} /></div>
      )}

      <div style={{ padding: '12px 20px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>Student visibility</div>
          <div style={{ fontSize: 12, color: q.isAnswerVisible ? '#155724' : '#888' }}>{q.isAnswerVisible ? '✓ Answer visible to students' : 'Answer hidden from students'}</div>
        </div>
        <button onClick={() => onToggleVisibility(q._id, q.isAnswerVisible)} style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', background: q.isAnswerVisible ? '#28a745' : '#ccc', transition: 'background 0.2s' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: q.isAnswerVisible ? 23 : 3, transition: 'left 0.2s' }} />
        </button>
      </div>
    </div>
  );
};

/* ── Gradebook view ── */
const GradebookView = ({ courseId }) => {
  const [grades, setGrades]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/grades/course/${courseId}`).then(r => setGrades(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading gradebook…</div>;
  if (!grades.length) return <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#888' }}>No submissions yet.</div>;

  return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', overflow: 'hidden' }}>
      <div style={{ background: '#0f6cbf', padding: '14px 20px' }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>Gradebook — {courseId}</h2>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            {['Student','Questions attempted','Overall score'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>{h}</th>)}
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
    axios.get(`/api/plagiarism/course/${courseId}?threshold=${threshold}`).then(r => setResult(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ background: '#0f6cbf', padding: '14px 20px' }}><h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>Plagiarism Detection</h2></div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 16px' }}>Compares submissions using Jaccard token similarity.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Threshold:</label>
            <input type="number" min={0} max={100} value={threshold} onChange={e => setThreshold(e.target.value)} style={{ width: 70, padding: '6px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }} />
            <span style={{ fontSize: 13, color: '#666' }}>%</span>
            <button onClick={run} disabled={loading} style={s.btnBlue}>{loading ? 'Checking…' : 'Run check'}</button>
          </div>
        </div>
      </div>
      {result && (
        result.pairs.length === 0
          ? <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 6, padding: 20, color: '#155724', fontSize: 14 }}>✓ No suspicious pairs found.</div>
          : <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#fff3cd', borderBottom: '1px solid #dee2e6', fontSize: 13, color: '#856404', fontWeight: 500 }}>⚠ {result.pairs.length} suspicious pair{result.pairs.length !== 1 ? 's' : ''} found</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f8f9fa' }}>{['Student A','Student B','Question','Similarity'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>{h}</th>)}</tr></thead>
                <tbody>{result.pairs.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 16px' }}>{p.studentA}</td>
                    <td style={{ padding: '10px 16px' }}>{p.studentB}</td>
                    <td style={{ padding: '10px 16px', color: '#666', fontSize: 12 }}>{p.questionId}</td>
                    <td style={{ padding: '10px 16px' }}><span style={{ fontWeight: 700, color: p.similarity >= 90 ? '#dc3545' : '#856404' }}>{p.similarity}%</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
      )}
    </div>
  );
};

/* ── My Courses view ── */
const CoursesView = ({ courses, activeCourseCode, onSwitchCourse, onCoursesChanged, onOpenCourse }) => {
  const [form, setForm]         = useState({ name: '', description: '', password: '', code: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState('');
  const [created, setCreated]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (code, name) => {
    if (!window.confirm(`Delete "${name}"?\n\nThis cannot be undone.`)) return;
    setDeleting(code);
    try { await axios.delete(`/api/courses/${code}`); onCoursesChanged(); }
    catch (err) { alert(err.response?.data?.error || 'Could not delete course.'); }
    finally { setDeleting(null); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    if (!form.name.trim() || !form.password.trim()) { setError('Course name and enrollment password are required.'); return; }
    setCreating(true);
    try {
      const res = await axios.post('/api/courses', form);
      setCreated(res.data); setForm({ name: '', description: '', password: '', code: '' });
      onCoursesChanged(); onSwitchCourse(res.data.code);
    } catch (err) { setError(err.response?.data?.error || 'Could not create course.'); }
    finally { setCreating(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#333' }}>Dashboard</h1>
        <button onClick={() => setShowForm(v => !v)} style={s.btnBlue}>{showForm ? 'Cancel' : '+ Create course'}</button>
      </div>
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: '#0f6cbf', padding: '14px 20px' }}><h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>Create a new course</h2></div>
          <form onSubmit={handleCreate} style={{ padding: 20 }}>
            {error && <div style={{ background: '#fdf2f2', border: '1px solid #f5c6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#842029' }}>{error}</div>}
            {created && <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#155724' }}>
              ✓ Course created! Code: <strong style={{ fontFamily: 'monospace' }}>{created.code}</strong> · Password: <strong>{created.enrollmentPassword}</strong>
            </div>}
            <div style={{ marginBottom: 14 }}><label style={s.label}>Course name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={s.input} placeholder="e.g. CS101 – Intro to MIPS Assembly" /></div>
            <div style={{ marginBottom: 14 }}><label style={s.label}>Description <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...s.input, height: 70, resize: 'vertical' }} /></div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Course code <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} style={{ ...s.input, fontFamily: 'monospace', letterSpacing: 1 }} placeholder="e.g. MIPS01" maxLength={10} />
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Leave blank to auto-generate.</div>
            </div>
            <div style={{ marginBottom: 18 }}><label style={s.label}>Enrollment password</label><input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={s.input} /></div>
            <button type="submit" disabled={creating} style={s.btnBlue}>{creating ? 'Creating…' : 'Create course'}</button>
          </form>
        </div>
      )}
      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#333' }}>Your courses ({courses.length})</h3>
      {courses.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 30, textAlign: 'center', color: '#888', fontSize: 13 }}>No courses yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {courses.map((c, i) => (
            <div key={c.code} onClick={() => onOpenCourse(c.code)} style={{ background: '#fff', borderRadius: 8, border: '1px solid #dee2e6', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow .15s, transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ height: 80, background: COURSE_PATTERNS[i % COURSE_PATTERNS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace', textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>{c.code}</span>
              </div>
              <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 4 }}>
                  {c.name}
                  {activeCourseCode === c.code && <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#e8f0fb', color: '#0f6cbf', fontWeight: 600 }}>ACTIVE</span>}
                </div>
                {c.description && <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.description}</div>}
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{c.studentCount} student{c.studentCount !== 1 ? 's' : ''} enrolled</div>
                {c.enrollmentPassword && (
                  <div style={{ fontSize: 12, background: '#f0f7ff', border: '1px solid #cce0ff', borderRadius: 4, padding: '4px 8px', marginBottom: 10, color: '#0f6cbf', fontFamily: 'monospace' }}>
                    🔑 Password: <strong>{c.enrollmentPassword}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  {activeCourseCode !== c.code && <button onClick={e => { e.stopPropagation(); onSwitchCourse(c.code); }} style={{ ...s.btnGray, flex: 1 }}>Set active</button>}
                  <button onClick={e => { e.stopPropagation(); onOpenCourse(c.code); }} style={{ ...s.btnBlue, flex: 1 }}>Open →</button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(c.code, c.name); }} disabled={deleting === c.code} style={{ ...s.btnRed, flex: 1 }}>{deleting === c.code ? '…' : 'Delete'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Add question form (within a session) ── */
const AddQuestionForm = ({ sessionId, courseId, onAdded, onCancel }) => {
  const [form, setForm] = useState({ title: '', description: '', difficulty: 'medium', language: 'c', placeholderCode: '', hideTestCases: false });
  const [testCases, setTestCases] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(f => ({ ...f, placeholderCode: PLACEHOLDERS[f.language] || '' }));
  }, []);

  const handleLanguageChange = (lang) => {
    setForm(f => ({ ...f, language: lang, placeholderCode: PLACEHOLDERS[lang] || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.language) return;
    setSaving(true);
    try {
      const res = await axios.post(`/api/sessions/${sessionId}/questions`, {
        ...form, testCases,
      });
      onAdded(res.data);
    } catch(e) { console.error(e); alert('Failed to add question.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#f8f9ff', border: '1px solid #cce0ff', borderRadius: 6, padding: 20, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#0f6cbf' }}>Add question to session</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}><label style={s.label}>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={s.input} placeholder="e.g. Sum two numbers" required /></div>
        <div style={{ marginBottom: 12 }}><label style={s.label}>Description / instructions</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...s.input, height: 80, resize: 'vertical' }} placeholder="What should students implement?" required /></div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>Difficulty</label>
            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} style={s.input}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={s.label}>Language</label>
            <select value={form.language} onChange={e => handleLanguageChange(e.target.value)} style={s.input}>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}><label style={s.label}>Placeholder code</label><textarea value={form.placeholderCode} onChange={e => setForm({ ...form, placeholderCode: e.target.value })} style={{ ...s.input, ...s.mono, height: 130, resize: 'vertical' }} /></div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ ...s.label, marginBottom: 0 }}>Test cases</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#555' }}>
              <div onClick={() => setForm(f => ({ ...f, hideTestCases: !f.hideTestCases }))} style={{ width: 40, height: 22, borderRadius: 11, background: form.hideTestCases ? '#0f6cbf' : '#ccc', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: form.hideTestCases ? 20 : 2, transition: 'left 0.2s' }} />
              </div>
              Hide test cases from students
            </label>
          </div>
          <TestCaseEditor cases={testCases} onChange={setTestCases} language={form.language} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={saving} style={s.btnBlue}>{saving ? 'Adding…' : 'Add question'}</button>
          <button type="button" onClick={onCancel} style={s.btnGray}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

/* ── Session detail view (questions in a session) ── */
const SessionDetail = ({ session, courseId, onBack, onSessionUpdated }) => {
  const [questions, setQuestions] = useState(session.questions || []);
  const [showAddQ, setShowAddQ]   = useState(false);

  const handleQuestionAdded = (data) => {
    // data = { session: populated, question: new question }
    setQuestions(data.session?.questions || [...questions, data.question]);
    setShowAddQ(false);
  };

  const handleUpdate = (updated) => setQuestions(qs => qs.map(q => q._id === updated._id ? { ...q, ...updated } : q));
  const handleToggleVisibility = async (id, current) => {
    try {
      const res = await axios.patch(`/api/questions/${id}/visibility`, { isAnswerVisible: !current });
      handleUpdate(res.data);
    } catch(e) { console.error(e); }
  };

  const handleRemove = async (qid) => {
    try {
      const res = await axios.delete(`/api/sessions/${session._id}/questions/${qid}`);
      setQuestions(res.data?.questions || questions.filter(q => q._id !== qid));
    } catch(e) { console.error(e); alert('Failed to remove question.'); }
  };

  return (
    <div>
      {/* Session header */}
      <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ background: '#0f6cbf', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600, flex: 1 }}>{session.name}</h2>
          {session.isTimed && (
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, padding: '3px 10px', borderRadius: 10, fontWeight: 500 }}>
              ⏱ {session.durationMinutes} min
            </span>
          )}
          <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, padding: '3px 10px', borderRadius: 10 }}>
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </span>
        </div>
        {session.description && (
          <div style={{ padding: '12px 20px', fontSize: 13, color: '#555', borderBottom: '1px solid #f0f0f0' }}>{session.description}</div>
        )}
        <div style={{ padding: '10px 20px', display: 'flex', gap: 16, fontSize: 12, color: '#888' }}>
          <span>Multiple attempts: {session.allowMultipleAttempts ? 'Yes' : 'No'}</span>
          {session.isTimed && <span>Timed: {session.durationMinutes} minutes</span>}
        </div>
      </div>

      {/* Add question form */}
      {showAddQ && (
        <AddQuestionForm
          sessionId={session._id}
          courseId={courseId}
          onAdded={handleQuestionAdded}
          onCancel={() => setShowAddQ(false)}
        />
      )}

      {/* Questions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#333' }}>
          Questions <span style={{ fontWeight: 400, color: '#888', fontSize: 14 }}>({questions.length})</span>
        </h3>
        {!showAddQ && <button onClick={() => setShowAddQ(true)} style={s.btnBlue}>+ Add question</button>}
      </div>

      {questions.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#888' }}>
          No questions yet. Click "+ Add question" to get started.
        </div>
      ) : (
        questions.map((q, i) => (
          <QuestionCard
            key={q._id}
            q={q}
            index={i}
            onUpdate={handleUpdate}
            onToggleVisibility={handleToggleVisibility}
            onRemove={handleRemove}
            sessionId={session._id}
          />
        ))
      )}
    </div>
  );
};

/* ── Sessions list view ── */
const SessionsView = ({ courseId, user }) => {
  const [sessions, setSessions]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', isTimed: false, durationMinutes: 30, allowMultipleAttempts: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchSessions = useCallback(async () => {
    if (!courseId || courseId === 'course-001') { setLoading(false); return; }
    try {
      const res = await axios.get(`/api/sessions/course/${courseId}`);
      setSessions(res.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { setLoading(true); fetchSessions(); }, [fetchSessions]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await axios.post('/api/sessions', { ...form, courseId, createdBy: user?.username || 'teacher' });
      setSessions([res.data, ...sessions]);
      setForm({ name: '', description: '', isTimed: false, durationMinutes: 30, allowMultipleAttempts: true });
      setShowCreate(false);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (sess) => {
    if (!window.confirm(`Delete session "${sess.name}"? All questions in it will be deleted.`)) return;
    setDeleting(sess._id);
    try {
      await axios.delete(`/api/sessions/${sess._id}`);
      setSessions(sessions.filter(s => s._id !== sess._id));
    } catch(e) { alert('Failed to delete session.'); }
    finally { setDeleting(null); }
  };

  const openSession = async (sess) => {
    try {
      const res = await axios.get(`/api/sessions/${sess._id}`);
      setActiveSession(res.data);
    } catch(e) { console.error(e); }
  };

  if (activeSession) {
    return (
      <SessionDetail
        session={activeSession}
        courseId={courseId}
        onBack={() => { setActiveSession(null); fetchSessions(); }}
        onSessionUpdated={() => {}}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#333' }}>Sessions</h1>
        <button onClick={() => setShowCreate(v => !v)} style={s.btnBlue}>{showCreate ? 'Cancel' : '+ Add session'}</button>
      </div>

      {showCreate && (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ background: '#0f6cbf', padding: '14px 20px' }}><h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>Create session</h2></div>
          <form onSubmit={handleCreate} style={{ padding: 20 }}>
            <div style={{ marginBottom: 14 }}><label style={s.label}>Session name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={s.input} placeholder="e.g. Lab 1 – Arrays" required /></div>
            <div style={{ marginBottom: 14 }}><label style={s.label}>Description <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...s.input, height: 70, resize: 'vertical' }} /></div>

            {/* Timed toggle */}
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <div onClick={() => setForm(f => ({ ...f, isTimed: !f.isTimed }))} style={{ width: 40, height: 22, borderRadius: 11, background: form.isTimed ? '#0f6cbf' : '#ccc', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: form.isTimed ? 20 : 2, transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontWeight: 500 }}>Timed session</span>
              </label>
              {form.isTimed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" min={1} max={300} value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 30 })} style={{ ...s.input, width: 80 }} />
                  <span style={{ fontSize: 13, color: '#666' }}>minutes</span>
                </div>
              )}
            </div>

            {/* Allow multiple attempts toggle */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <div onClick={() => setForm(f => ({ ...f, allowMultipleAttempts: !f.allowMultipleAttempts }))} style={{ width: 40, height: 22, borderRadius: 11, background: form.allowMultipleAttempts ? '#0f6cbf' : '#ccc', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: form.allowMultipleAttempts ? 20 : 2, transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontWeight: 500 }}>Allow multiple attempts per question</span>
              </label>
            </div>

            <button type="submit" disabled={saving} style={s.btnBlue}>{saving ? 'Creating…' : 'Create session'}</button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#888' }}>
          No sessions yet. Click "+ Add session" to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((sess, i) => (
            <div key={sess._id} style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: COURSE_PATTERNS[i % COURSE_PATTERNS.length], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#333', marginBottom: 3 }}>{sess.name}</div>
                  {sess.description && <div style={{ fontSize: 12, color: '#888' }}>{sess.description}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#e8f0fb', color: '#0f6cbf', fontWeight: 500 }}>
                      {sess.questions?.length || 0} question{(sess.questions?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    {sess.isTimed && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#fff3cd', color: '#856404', fontWeight: 500 }}>⏱ {sess.durationMinutes} min</span>
                    )}
                    {!sess.allowMultipleAttempts && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f8d7da', color: '#721c24', fontWeight: 500 }}>Single attempt</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openSession(sess)} style={s.btnBlue}>Open →</button>
                  <button onClick={() => handleDelete(sess)} disabled={deleting === sess._id} style={s.btnRed}>{deleting === sess._id ? '…' : 'Delete'}</button>
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
  const [active, setActive] = useState('courses');
  const [toast, setToast]   = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const activeCourse = courses.find(c => c.code === activeCourseCode);
  const noActiveCourse = !activeCourse;

  const handleOpenCourse = (code) => { onSwitchCourse(code); setActive('sessions'); };

  const sectionLabels = { sessions: 'Sessions', grades: 'Gradebook', plagiarism: 'Plagiarism check', courses: 'My courses' };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 52px)', background: '#f2f2f2' }}>
      <Sidebar active={active} setActive={setActive} activeCourse={activeCourse} />
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          <span style={{ color: '#0f6cbf', cursor: 'pointer' }} onClick={() => setActive('courses')}>Dashboard</span>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: '#0f6cbf', cursor: 'pointer' }} onClick={() => setActive('courses')}>{activeCourse ? activeCourse.code : 'No courses yet'}</span>
          <span style={{ margin: '0 6px' }}>›</span>
          <span>{sectionLabels[active] || 'Sessions'}</span>
        </div>

        {toast && (
          <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', borderRadius: 4, padding: '10px 16px', marginBottom: 16, fontSize: 14 }}>✓ {toast}</div>
        )}

        {['sessions', 'grades', 'plagiarism'].includes(active) && noActiveCourse && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>{sectionLabels[active]}</h1>
            <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>You don't have any courses yet.</div>
              <button onClick={() => setActive('courses')} style={s.btnBlue}>Go to Dashboard</button>
            </div>
          </>
        )}

        {active === 'sessions' && !noActiveCourse && (
          <SessionsView courseId={courseId} user={user} />
        )}

        {active === 'grades' && !noActiveCourse && (
          <><h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>Gradebook</h1><GradebookView courseId={courseId} /></>
        )}

        {active === 'plagiarism' && !noActiveCourse && (
          <><h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>Plagiarism Check</h1><PlagiarismView courseId={courseId} /></>
        )}

        {active === 'courses' && (
          <CoursesView courses={courses} activeCourseCode={activeCourseCode} onSwitchCourse={onSwitchCourse} onCoursesChanged={onCoursesChanged} onOpenCourse={handleOpenCourse} />
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
