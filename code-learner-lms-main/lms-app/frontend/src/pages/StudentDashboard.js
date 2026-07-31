import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const LANG_LABEL = Object.fromEntries(LANGUAGES.map(l => [l.value, l.label]));

const PLACEHOLDERS = {
  mips:       '# MIPS Assembly\n.data\n    # data section\n\n.text\nmain:\n    # your code here\n\n    li $v0, 10\n    syscall',
  c:          '#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}',
  cpp:        '#include <iostream>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}',
  python:     '# Python\ndef solution():\n    # your code here\n    pass\n\nsolution()',
  java:       'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your code here\n    }\n}',
  javascript: 'function solution() {\n    // your code here\n}\n\nsolution();',
  csharp:     'using System;\n\nclass Solution {\n    static void Main() {\n        // your code here\n    }\n}',
  ruby:       'def solution\n  # your code here\nend\n\nsolution',
  flex:       '%option noyywrap\n%%\n[a-zA-Z]+  { printf("WORD: %s\\n", yytext); }\n[0-9]+     { printf("NUM: %s\\n", yytext); }\n\\n         { }\n.          { }\n%%\nint main() {\n    yylex();\n    return 0;\n}',
};

const s = {
  input:   { width: '100%', padding: '7px 11px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  mono:    { fontFamily: 'SFMono-Regular, Consolas, monospace', fontSize: 12 },
  btnBlue: { padding: '7px 16px', background: '#0f6cbf', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  btnGray: { padding: '7px 16px', background: '#fff', color: '#333', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
};

/* ── SQL schema reference panel ── */
const SqlSchemaPanel = ({ setupSql }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: '1px solid #ced4da', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#f0f4ff', cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#0f6cbf' }}>🗂 Table schema (auto-created before your query runs)</span>
        <span style={{ fontSize: 12, color: '#888' }}>{open ? '▲ hide' : '▼ show'}</span>
      </div>
      {open && (
        <pre style={{ margin: 0, padding: '10px 12px', background: '#1e1e2e', color: '#a6e3a1', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
          {setupSql}
        </pre>
      )}
    </div>
  );
};

/* ── Per-question code editor ── */
const CodeEditor = ({ question, studentId, studentUsername, courseId, hideTestCases: forceHide, onAttempted }) => {
  const lsKey = `code_draft_${question._id}`;
  const [lang, setLang]         = useState(question.language || '');
  const [code, setCode]         = useState(() => {
    // Restore auto-saved draft; fall back to placeholder
    try { return localStorage.getItem(lsKey) || question.placeholderCode || PLACEHOLDERS[question.language] || ''; }
    catch { return question.placeholderCode || PLACEHOLDERS[question.language] || ''; }
  });
  const [running, setRunning]   = useState(false);
  const [result, setResult]     = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(null); // null = unlimited or unknown
  const hideTC = forceHide || question.hideTestCases;

  // Auto-save code to localStorage as student types
  useEffect(() => {
    try { localStorage.setItem(lsKey, code); } catch {}
  }, [code, lsKey]);

  // Fetch remaining attempts if question has a limit
  useEffect(() => {
    if (!question.maxAttempts || question.maxAttempts === 0) return;
    axios.get('/api/submissions/attempts', { params: { questionId: question._id, studentUsername: studentUsername || studentId } })
      .then(r => setAttemptsLeft(Math.max(0, question.maxAttempts - r.data.count)))
      .catch(() => {});
  }, [question._id, question.maxAttempts, studentId]);

  const runCode = async () => {
    if (!lang) { alert('Please select a language first.'); return; }
    if (!code.trim()) { alert('Please write some code first.'); return; }
    setRunning(true); setResult(null);
    try {
      const res = await axios.post('/api/submissions', { questionId: question._id, courseId, studentId, language: lang, code });
      setResult(res.data);
      if (onAttempted) onAttempted(question._id);
      // Refresh attempt count
      if (question.maxAttempts > 0) {
        setAttemptsLeft(prev => prev !== null ? Math.max(0, prev - 1) : null);
      }
    } catch (e) {
      setResult({ executionError: e.response?.data?.error || e.message, testResults: [] });
      if (onAttempted) onAttempted(question._id);
    } finally { setRunning(false); }
  };

  return (
    <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Your code</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: '#666' }}>Language:</label>
          <select value={lang} onChange={e => setLang(e.target.value)} style={{ ...s.input, width: 170, padding: '4px 8px', fontSize: 12 }}>
            <option value="">— Choose —</option>
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          {attemptsLeft !== null && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: attemptsLeft > 0 ? '#fff3cd' : '#f8d7da', color: attemptsLeft > 0 ? '#856404' : '#721c24', fontWeight: 600 }}>
              {attemptsLeft > 0 ? `${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left` : 'No attempts left'}
            </span>
          )}
          <span style={{ fontSize: 10, color: '#aaa' }}>💾 auto-saved</span>
          <button onClick={runCode} disabled={running || !lang || !code.trim() || attemptsLeft === 0} style={{ ...s.btnBlue, padding: '5px 16px', fontSize: 12, opacity: (running || !lang || !code.trim() || attemptsLeft === 0) ? 0.6 : 1 }}>
            {running ? '⏳ Running…' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* SQL schema reference panel */}
      {lang === 'sql' && (() => {
        const setupSql = (question.testCases || []).map(tc => tc.input).filter(Boolean).join('\n\n').trim();
        if (!setupSql) return null;
        return <SqlSchemaPanel setupSql={setupSql} />;
      })()}

      {/* Unified code editor — pre/post locked (dimmed), middle editable */}
      <div style={{ border: '1px solid #313244', borderRadius: 4, overflow: 'hidden', background: '#1e1e2e', position: 'relative' }}>

        {/* 🔒 badge — only shown when there is driver code */}
        {(question.driverPreCode || question.driverPostCode) && (
          <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 10, color: '#585b70', background: '#1e1e2e', padding: '1px 6px', borderRadius: 8, zIndex: 1, userSelect: 'none' }}>🔒 driver code</span>
        )}

        {/* Pre-code — dimmed, not selectable */}
        {question.driverPreCode && (
          <pre style={{ margin: 0, padding: '10px 12px 0', ...s.mono, color: '#585b70', background: '#1e1e2e', whiteSpace: 'pre-wrap', fontSize: 13, userSelect: 'none', pointerEvents: 'none' }}>
            {question.driverPreCode}
          </pre>
        )}

        {/* Editable student section — seamlessly continues */}
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder={lang ? (PLACEHOLDERS[lang] || '// write your solution here') : '// select a language above'}
          style={{ ...s.mono, width: '100%', height: 140, resize: 'vertical', background: '#1e1e2e', color: '#cdd6f4', border: 'none', outline: 'none', padding: question.driverPreCode ? '2px 12px' : '10px 12px', boxSizing: 'border-box', fontSize: 13, display: 'block' }}
        />

        {/* Post-code — dimmed, not selectable */}
        {question.driverPostCode && (
          <pre style={{ margin: 0, padding: '0 12px 10px', ...s.mono, color: '#585b70', background: '#1e1e2e', whiteSpace: 'pre-wrap', fontSize: 13, userSelect: 'none', pointerEvents: 'none' }}>
            {question.driverPostCode}
          </pre>
        )}
      </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Test results</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: result.score >= 80 ? '#155724' : result.score >= 50 ? '#856404' : '#721c24' }}>
                    {result.totalPassed}/{result.totalCases} passed — {result.score}%
                  </span>
                </div>
              )}
              {result.testResults.map((tr, i) => {
                const isVerdict = tr.passed !== null && tr.passed !== undefined;
                const borderColor = !isVerdict ? '#dee2e6' : (tr.passed ? '#c3e6cb' : '#f5c6cb');
                const bg = !isVerdict ? '#f8f9fa' : (tr.passed ? '#f0fff4' : '#fff5f5');
                return (
                  <div key={i} style={{ border: `1px solid ${borderColor}`, background: bg, borderRadius: 4, padding: '10px 14px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{tr.label || `Test ${i + 1}`}</span>
                      {isVerdict && <span style={{ fontSize: 12, fontWeight: 600, color: tr.passed ? '#155724' : '#721c24' }}>{tr.passed ? '✓ Passed' : '✗ Failed'}</span>}
                    </div>
                    {!tr.isHidden && !hideTC && (
                      <div style={{ display: 'grid', gridTemplateColumns: isVerdict ? '1fr 1fr' : '1fr', gap: 8, fontSize: 12 }}>
                        {isVerdict && (
                          <>
                            <div><div style={{ color: '#888', marginBottom: 2 }}>Input</div><pre style={{ ...s.mono, background: '#f8f9fa', padding: '6px 8px', borderRadius: 3, margin: 0, whiteSpace: 'pre-wrap' }}>{tr.input || '(none)'}</pre></div>
                            <div><div style={{ color: '#888', marginBottom: 2 }}>Expected</div><pre style={{ ...s.mono, background: '#f8f9fa', padding: '6px 8px', borderRadius: 3, margin: 0, whiteSpace: 'pre-wrap' }}>{tr.expectedOutput || '(any)'}</pre></div>
                          </>
                        )}
                        <div style={{ gridColumn: isVerdict ? '1 / -1' : 'auto' }}>
                          <div style={{ color: '#888', marginBottom: 2 }}>Your output</div>
                          <pre style={{ ...s.mono, background: !isVerdict ? '#f8f9fa' : (tr.passed ? '#f0fff4' : '#fff0f0'), padding: '6px 8px', borderRadius: 3, margin: 0, whiteSpace: 'pre-wrap', color: !isVerdict ? '#333' : (tr.passed ? '#155724' : '#721c24') }}>{tr.actualOutput || '(no output)'}</pre>
                        </div>
                      </div>
                    )}
                    {(tr.isHidden || hideTC) && (
                      <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>Test case details are hidden.</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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

/* ── Session experience (timed, with progress bar + navigator) ── */
const SessionExperience = ({ session, courseId, studentId, rollNumber, onExit }) => {
  const questions = session.questions || [];
  const total = questions.length;

  const [currentIdx, setCurrentIdx]     = useState(0);
  const [attempted, setAttempted]       = useState(new Set()); // questionIds
  const [navOpen, setNavOpen]           = useState(true);
  const [secsLeft, setSecsLeft]         = useState(session.isTimed ? (session.durationMinutes || 30) * 60 : null);
  const [submitted, setSubmitted]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const timerRef    = useRef(null);
  // Use refs so doAutoSubmit never changes identity → timer never resets on submission
  const attemptedRef  = useRef(attempted);
  const submittedRef  = useRef(false);
  const submittingRef = useRef(false);
  attemptedRef.current = attempted; // keep ref in sync with state

  const attemptedCount = attempted.size;
  const progress = total > 0 ? (attemptedCount / total) * 100 : 0;

  const handleAttempted = useCallback((qid) => {
    setAttempted(prev => { const next = new Set(prev); next.add(qid); return next; });
  }, []);

  const doAutoSubmit = useCallback(async () => {
    if (submittedRef.current || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await axios.post(`/api/sessions/${session._id}/auto-submit`, {
        studentId, courseId,
        rollNumber: rollNumber || '',
        attempted: Array.from(attemptedRef.current),
      });
      submittedRef.current = true;
      setSubmitted(true);
    } catch(e) { console.error(e); submittedRef.current = true; setSubmitted(true); }
    finally { submittingRef.current = false; setSubmitting(false); }
  }, [session._id, studentId, courseId, rollNumber]); // stable — no Set/boolean deps

  // Countdown timer — depends only on secsLeft, not doAutoSubmit (stable ref)
  useEffect(() => {
    if (!session.isTimed || secsLeft === null) return;
    if (secsLeft <= 0) { doAutoSubmit(); return; }
    timerRef.current = setTimeout(() => setSecsLeft(s => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [secsLeft, session.isTimed, doAutoSubmit]);

  const fmtTime = (s) => {
    if (s <= 0) return '00:00';
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const timerColor = secsLeft !== null && secsLeft < 60 ? '#dc3545' : secsLeft !== null && secsLeft < 300 ? '#856404' : '#155724';
  const timerBg    = secsLeft !== null && secsLeft < 60 ? '#f8d7da' : secsLeft !== null && secsLeft < 300 ? '#fff3cd' : '#d4edda';

  if (submitted) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #dee2e6', maxWidth: 500, margin: '0 auto', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', color: '#333' }}>Session submitted!</h2>
          <p style={{ color: '#666', fontSize: 14, margin: '0 0 24px' }}>
            You attempted {attemptedCount} of {total} question{total !== 1 ? 's' : ''}. Unattempted questions were scored 0.
          </p>
          <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '12px 20px', marginBottom: 24, display: 'inline-block' }}>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Questions attempted</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#0f6cbf' }}>{attemptedCount} / {total}</div>
          </div>
          <br />
          <button onClick={onExit} style={s.btnBlue}>Back to sessions</button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 104px)', margin: '-24px', background: '#f2f2f2' }}>
      {/* Session top bar */}
      <div style={{ background: '#0f6cbf', flexShrink: 0 }}>
        {/* Top row: nav toggle, session name, controls */}
        <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setNavOpen(v => !v)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, color: '#fff', padding: '5px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {navOpen ? '◀' : '▶'} Questions
          </button>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: 0.2 }}>{session.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', background: 'rgba(0,0,0,0.15)', padding: '3px 10px', borderRadius: 12 }}>
            {attemptedCount}/{total} attempted
          </div>
          {session.isTimed && secsLeft !== null && (
            <div style={{ background: timerBg, color: timerColor, padding: '4px 14px', borderRadius: 6, fontFamily: 'monospace', fontWeight: 700, fontSize: 15, border: `1.5px solid ${timerColor}` }}>
              ⏱ {fmtTime(secsLeft)}
            </div>
          )}
          <button onClick={() => { if(window.confirm('Submit session? Unattempted questions will be scored 0.')) doAutoSubmit(); }} disabled={submitting} style={{ background: '#fff', color: '#0f6cbf', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {submitting ? 'Submitting…' : 'Submit all'}
          </button>
          <button onClick={() => { if(window.confirm('Exit session? Your answers are saved, but unattempted questions won\'t be auto-submitted.')) onExit(); }} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, color: '#fff', padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>Exit</button>
        </div>
        {/* Progress bar */}
        <div style={{ height: 5, background: 'rgba(255,255,255,0.2)' }}>
          <div style={{ height: 5, width: `${progress}%`, background: progress === 100 ? '#4cdb7a' : '#fff', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Collapsible question navigator */}
        {navOpen && (
          <div style={{ width: 220, background: '#fff', borderRight: '1px solid #dee2e6', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8 }}>Questions</div>
            {questions.map((q, i) => {
              const isAttempted = attempted.has(q._id);
              const isCurrent   = i === currentIdx;
              return (
                <button key={q._id} onClick={() => setCurrentIdx(i)} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                  background: isCurrent ? '#e8f0fb' : 'transparent',
                  borderLeft: isCurrent ? '4px solid #0f6cbf' : '4px solid transparent',
                  border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid #f5f5f5',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: isAttempted ? '#28a745' : isCurrent ? '#0f6cbf' : '#e9ecef',
                      color: (isAttempted || isCurrent) ? '#fff' : '#666',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {isAttempted ? '✓' : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#0f6cbf' : '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{DIFF_COLORS[q.difficulty] ? q.difficulty : ''}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Question panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {q ? (
            <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', overflow: 'hidden', maxWidth: 900 }}>
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0f6cbf', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                  {currentIdx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#333', marginBottom: 4 }}>{q.title}</div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8, whiteSpace: 'pre-wrap' }}>{q.description}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: DIFF_COLORS[q.difficulty]?.bg || '#eee', color: DIFF_COLORS[q.difficulty]?.color || '#333' }}>{q.difficulty}</span>
                    {q.language && <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: '#e8f0fb', color: '#0f6cbf' }}>{LANG_LABEL[q.language] || q.language}</span>}
                    {q.testCases?.length > 0 && !q.hideTestCases && <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: '#e8f8f5', color: '#0d9488' }}>{q.testCases.length} test case{q.testCases.length !== 1 ? 's' : ''}</span>}
                    {q.hideTestCases && <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: '#fff3cd', color: '#856404' }}>Test cases hidden</span>}
                    {attempted.has(q._id) && <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 500, background: '#d4edda', color: '#155724' }}>✓ Attempted</span>}
                  </div>
                </div>
              </div>
              <CodeEditor key={q._id} question={q} studentId={studentId} studentUsername={studentUsername} courseId={courseId} hideTestCases={q.hideTestCases} onAttempted={handleAttempted} />
              {/* Navigation arrows */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} style={{ ...s.btnGray, opacity: currentIdx === 0 ? 0.4 : 1 }}>← Previous</button>
                <span style={{ fontSize: 13, color: '#888', alignSelf: 'center' }}>{currentIdx + 1} / {total}</span>
                <button onClick={() => setCurrentIdx(i => Math.min(total - 1, i + 1))} disabled={currentIdx === total - 1} style={{ ...s.btnGray, opacity: currentIdx === total - 1 ? 0.4 : 1 }}>Next →</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>No questions in this session.</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Sessions list (student view) ── */
const StudentSessionsView = ({ courseId, studentId, studentUsername, rollNumber }) => {
  const [sessions, setSessions]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  const fetchSessions = useCallback(async () => {
    if (!courseId || courseId === 'course-001') { setLoading(false); return; }
    try {
      const res = await axios.get(`/api/sessions/course/${courseId}`);
      setSessions(res.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { setLoading(true); fetchSessions(); }, [fetchSessions]);

  // Poll every 30 seconds so students see session open/close without manual refresh
  useEffect(() => {
    const id = setInterval(() => { fetchSessions(); }, 30000);
    return () => clearInterval(id);
  }, [fetchSessions]);

  const openSession = async (sess) => {
    try {
      const res = await axios.get(`/api/sessions/${sess._id}`);
      setActiveSession(res.data);
    } catch(e) { console.error(e); }
  };

  if (activeSession) {
    return (
      <SessionExperience
        session={activeSession}
        courseId={courseId}
        studentId={studentId}
        rollNumber={rollNumber}
        onExit={() => { setActiveSession(null); fetchSessions(); }}
      />
    );
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading sessions…</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#333' }}>Sessions</h1>
        <button onClick={() => { setLoading(true); fetchSessions(); }} style={{ background: 'none', border: '1px solid #dee2e6', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: '#555' }}>↻ Refresh</button>
      </div>
      {sessions.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#888' }}>
          No sessions available yet. Check back later.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((sess, i) => (
            <div key={sess._id} style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: COURSE_PATTERNS[i % COURSE_PATTERNS.length], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#333', marginBottom: 3 }}>{sess.name}</div>
                  {sess.description && <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{sess.description}</div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#e8f0fb', color: '#0f6cbf', fontWeight: 500 }}>{sess.questions?.length || 0} question{(sess.questions?.length || 0) !== 1 ? 's' : ''}</span>
                    {sess.isTimed && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#fff3cd', color: '#856404', fontWeight: 500 }}>⏱ {sess.durationMinutes} min</span>}
                  </div>
                </div>
                <button onClick={() => openSession(sess)} style={s.btnBlue}>Enter session →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Submission history ── */
const HistoryView = ({ studentId, courseId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/submissions/student/${studentId}?courseId=${courseId}`).then(r => setHistory(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [studentId, courseId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading history…</div>;
  if (!history.length) return <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#888' }}>No submissions yet.</div>;

  return (
    <div>
      {history.map((sub, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
            <div>
              <span style={{ fontWeight: 500, fontSize: 14, color: '#333' }}>{sub.questionId?.title || 'Question'}</span>
              <span style={{ marginLeft: 10, fontSize: 12, padding: '2px 8px', borderRadius: 10, background: '#e8f0fb', color: '#0f6cbf' }}>{LANG_LABEL[sub.language] || sub.language}</span>
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

/* ── My grades ── */
const MyGrades = ({ studentId, courseId }) => {
  const [grade, setGrade]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/grades/student/${studentId}?courseId=${courseId}`).then(r => setGrade(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [studentId, courseId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading grades…</div>;
  if (!grade || !grade.grades?.length) return <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center', color: '#888' }}>No grades yet.</div>;

  return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', overflow: 'hidden' }}>
      <div style={{ background: '#0f6cbf', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>My Grades</h2>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>{grade.totalScore}%</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ background: '#f8f9fa' }}>{['Question','Attempts','Best score'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>{h}</th>)}</tr></thead>
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
    { id: 'sessions', label: 'Sessions',        icon: '📚' },
    { id: 'history',  label: 'My submissions',  icon: '📁' },
    { id: 'grades',   label: 'My grades',       icon: '📊' },
    { id: 'courses',  label: 'My courses',      icon: '🏫' },
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
      <div style={{ padding: '6px 16px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8 }}>Active course</div>
      <div style={{ padding: '8px 16px', fontSize: 13, color: '#555' }}>
        {activeCourse ? (
          <><div style={{ fontWeight: 500, marginBottom: 2 }}>{activeCourse.code}</div><div style={{ color: '#888', fontSize: 12 }}>{activeCourse.name}</div></>
        ) : (
          <><div style={{ fontWeight: 500, marginBottom: 2 }}>No courses yet</div><div style={{ color: '#888', fontSize: 12 }}><button onClick={() => setActive('courses')} style={{ background: 'none', border: 'none', color: '#0f6cbf', cursor: 'pointer', padding: 0, fontSize: 12 }}>Join a course</button></div></>
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

/* ── Course access gate ── */
const CourseAccessGate = ({ course, defaultRollNumber, onUnlock }) => {
  const [password, setPassword]     = useState('');
  const [rollNumber, setRollNumber] = useState(defaultRollNumber || '');
  const [error, setError]           = useState('');
  const [verifying, setVerifying]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!password.trim() || !rollNumber.trim()) { setError('Roll number and course password are required.'); return; }
    setVerifying(true);
    try { await axios.post('/api/courses/verify', { code: course.code, password, rollNumber: rollNumber.trim() }); onUnlock(course.code); }
    catch (err) { setError(err.response?.data?.error || 'Could not verify access.'); }
    finally { setVerifying(false); }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', maxWidth: 440, overflow: 'hidden' }}>
      <div style={{ background: '#0f6cbf', padding: '14px 20px' }}><h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>🔒 {course.code} – {course.name}</h2></div>
      <form onSubmit={handleSubmit} style={{ padding: 20 }}>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>Enter your roll number and this course's password to access sessions.</p>
        {error && <div style={{ background: '#fdf2f2', border: '1px solid #f5c6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#842029' }}>{error}</div>}
        <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 }}>Roll number</label><input value={rollNumber} onChange={e => setRollNumber(e.target.value)} style={s.input} placeholder="e.g. 21CS045" /></div>
        <div style={{ marginBottom: 18 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 }}>Course password</label><input type="text" value={password} onChange={e => setPassword(e.target.value)} style={s.input} /></div>
        <button type="submit" disabled={verifying} style={s.btnBlue}>{verifying ? 'Verifying…' : 'Unlock course'}</button>
      </form>
    </div>
  );
};

/* ── My Courses (enroll) ── */
const StudentCoursesView = ({ courses, activeCourseCode, onSwitchCourse, onCoursesChanged, onOpenCourse, defaultRollNumber }) => {
  const [form, setForm]         = useState({ code: '', password: '', rollNumber: defaultRollNumber || '' });
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleEnroll = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.code.trim() || !form.password.trim() || !form.rollNumber.trim()) { setError('Course code, password and roll number are required.'); return; }
    setEnrolling(true);
    try {
      const res = await axios.post('/api/courses/enroll', { code: form.code.trim().toUpperCase(), password: form.password, rollNumber: form.rollNumber.trim() });
      setSuccess(`✓ Enrolled in ${res.data.course.name} (${res.data.course.code})`);
      setForm({ code: '', password: '', rollNumber: form.rollNumber });
      onCoursesChanged(); onSwitchCourse(res.data.course.code);
    } catch (err) { setError(err.response?.data?.error || 'Could not enroll in course.'); }
    finally { setEnrolling(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#333' }}>Dashboard</h1>
        <button onClick={() => setShowForm(v => !v)} style={s.btnBlue}>{showForm ? 'Cancel' : '+ Join a course'}</button>
      </div>
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: '#0f6cbf', padding: '14px 20px' }}><h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600 }}>Enroll in a course</h2></div>
          <form onSubmit={handleEnroll} style={{ padding: 20 }}>
            {error && <div style={{ background: '#fdf2f2', border: '1px solid #f5c6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#842029' }}>{error}</div>}
            {success && <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#155724' }}>{success}</div>}
            <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 }}>Course code</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} style={{ ...s.input, fontFamily: 'monospace', letterSpacing: 1 }} placeholder="e.g. AB12CD" /></div>
              <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 }}>Course password</label><input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={s.input} /></div>
            </div>
            <div style={{ marginBottom: 18 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 5 }}>Roll number</label><input value={form.rollNumber} onChange={e => setForm({ ...form, rollNumber: e.target.value })} style={s.input} placeholder="e.g. 21CS045" /></div>
            <button type="submit" disabled={enrolling} style={s.btnBlue}>{enrolling ? 'Enrolling…' : 'Enroll'}</button>
          </form>
        </div>
      )}
      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#333' }}>Your courses ({courses.length})</h3>
      {courses.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 30, textAlign: 'center', color: '#888', fontSize: 13 }}>You're not enrolled in any courses yet.</div>
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
                <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 6 }}>
                  {c.name}
                  {activeCourseCode === c.code && <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#e8f0fb', color: '#0f6cbf', fontWeight: 600 }}>ACTIVE</span>}
                </div>
                {c.description && <div style={{ fontSize: 12, color: '#888', marginBottom: 6, flex: 1 }}>{c.description}</div>}
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Roll: {c.rollNumber}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {activeCourseCode !== c.code && <button onClick={e => { e.stopPropagation(); onSwitchCourse(c.code); }} style={{ ...s.btnGray, flex: 1 }}>Set active</button>}
                  <button onClick={e => { e.stopPropagation(); onOpenCourse(c.code); }} style={{ ...s.btnBlue, flex: 1 }}>Open →</button>
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
  const studentId       = user?.name     || '';   // display name — used for submission lookup
  const studentUsername = user?.username || '';   // login username — used for attempt count
  const [activeSection, setActiveSection]     = useState('courses');
  const [unlockedCourses, setUnlockedCourses] = useState(new Set());

  const activeCourse = courses.find(c => c.code === activeCourseCode);
  const isLocked = !!activeCourse && !unlockedCourses.has(activeCourse.code);
  const noActiveCourse = !activeCourse;

  const handleOpenCourse = (code) => { onSwitchCourse(code); setActiveSection('sessions'); };
  const handleUnlock     = (code) => setUnlockedCourses(prev => { const n = new Set(prev); n.add(code); return n; });

  const sectionLabels = { sessions: 'Sessions', history: 'My submissions', grades: 'My grades', courses: 'My courses' };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 52px)', background: '#f2f2f2' }}>
      <Sidebar active={activeSection} setActive={setActiveSection} studentName={studentId} activeCourse={activeCourse} />
      <div style={{ flex: 1, padding: 24, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          <span style={{ color: '#0f6cbf', cursor: 'pointer' }} onClick={() => setActiveSection('courses')}>Dashboard</span>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: '#0f6cbf', cursor: 'pointer' }} onClick={() => setActiveSection('courses')}>{activeCourse ? activeCourse.code : 'No courses yet'}</span>
          <span style={{ margin: '0 6px' }}>›</span>
          <span>{sectionLabels[activeSection] || 'Sessions'}</span>
        </div>

        {['sessions','history','grades'].includes(activeSection) && noActiveCourse && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>{sectionLabels[activeSection]}</h1>
            <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #dee2e6', padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>You haven't joined any courses yet.</div>
              <button onClick={() => setActiveSection('courses')} style={s.btnBlue}>Go to Dashboard</button>
            </div>
          </>
        )}

        {['sessions','history','grades'].includes(activeSection) && !noActiveCourse && isLocked && (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>{sectionLabels[activeSection]}</h1>
            <CourseAccessGate course={activeCourse} defaultRollNumber={activeCourse.rollNumber || user?.rollNumber || ''} onUnlock={handleUnlock} />
          </>
        )}

        {activeSection === 'sessions' && !noActiveCourse && !isLocked && (
          <StudentSessionsView courseId={courseId} studentId={studentId} studentUsername={studentUsername} rollNumber={activeCourse?.rollNumber || user?.rollNumber || ''} />
        )}

        {activeSection === 'history' && !noActiveCourse && !isLocked && (
          <><h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>My Submissions</h1><HistoryView studentId={studentId} courseId={courseId} /></>
        )}

        {activeSection === 'grades' && !noActiveCourse && !isLocked && (
          <><h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600, color: '#333' }}>My Grades</h1><MyGrades studentId={studentId} courseId={courseId} /></>
        )}

        {activeSection === 'courses' && (
          <StudentCoursesView courses={courses} activeCourseCode={activeCourseCode} onSwitchCourse={onSwitchCourse} onCoursesChanged={onCoursesChanged} onOpenCourse={handleOpenCourse} defaultRollNumber={user?.rollNumber || ''} />
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
