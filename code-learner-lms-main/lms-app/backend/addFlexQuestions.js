/**
 * addFlexQuestions.js — adds 3 more Flex/Lex questions to Lab 2 (Session 2).
 * Run from the backend folder: node addFlexQuestions.js
 */
const axios = require('axios');
const BASE = 'http://localhost:5001/api';

async function main() {
  // Login as teacher
  const { data: { token } } = await axios.post(`${BASE}/auth/login`, {
    username: 'demo_teacher', password: 'teacher123',
  });
  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  // Find the course
  const courses = (await api.get(`${BASE}/courses/mine`)).data;
  if (!courses.length) { console.error('No courses found — run seedDemo.js first'); process.exit(1); }

  // Sessions use course.code as courseId (not _id)
  let s2 = null;
  for (const c of courses) {
    const sessions = (await api.get(`${BASE}/sessions/course/${c.code}`)).data;
    const found = sessions.find(s => s.name.includes('Lab 2') || s.name.includes('Exam'));
    if (found) { s2 = found; console.log(`Found Lab 2 in course: ${c.name} (${c.code})`); break; }
  }
  if (!s2) { console.error('Lab 2 session not found in any course.'); process.exit(1); }

  const questions = [
    /* ── Flex Q2: Count Digits ── */
    {
      title: 'Count Digits in Input',
      description:
`Write a Flex lexer that reads input and prints the **total number of digit characters** (0–9) found, followed by a newline.\n\nExample — input \`abc 123 x9\` → output \`4\`\n\nHint: use \`[0-9]\` as a character class rule and a counter variable.`,
      language: 'flex',
      difficulty: 'easy',
      driverPreCode: '',
      placeholderCode:
`%option noyywrap
%{
    /* TODO: declare a counter variable here */
%}
%%
/* TODO: add rules to count digits */
.|\n { /* skip everything else */ }
%%
int main() {
    yylex();
    /* TODO: print the count */
    return 0;
}`,
      driverPostCode: '',
      answer:
`%option noyywrap
%{
    int count = 0;
%}
%%
[0-9]  { count++; }
.|\n   { /* skip */ }
%%
int main() {
    yylex();
    printf("%d\\n", count);
    return 0;
}`,
      isAnswerVisible: false,
      hideTestCases: false,
      testCases: [
        { label: 'Mixed input',       input: 'abc 123 x9',       expectedOutput: '4', isHidden: false },
        { label: 'No digits',         input: 'hello world',      expectedOutput: '0', isHidden: false },
        { label: 'Only digits',       input: '9876543210',       expectedOutput: '10', isHidden: true  },
        { label: 'Digits in words',   input: 'a1b2c3',           expectedOutput: '3', isHidden: true  },
      ],
    },

    /* ── Flex Q3: Tokenise Identifiers and Numbers ── */
    {
      title: 'Classify Tokens',
      description:
`Write a Flex lexer that reads a line of text and prints one line per token in the format \`TYPE:value\`.\n\n- Integers (digits only) → \`INT:value\`\n- Identifiers (letters/underscores, then letters/digits/underscores) → \`ID:value\`\n- Anything else (single character) → \`OTHER:char\`\n- Whitespace → skip silently\n\nExample — input \`x1 42 a_b !\` → output:\n\`\`\`\nID:x1\nINT:42\nID:a_b\nOTHER:!\n\`\`\``,
      language: 'flex',
      difficulty: 'medium',
      driverPreCode: '',
      placeholderCode:
`%option noyywrap
%%
/* TODO: rule for integers */
/* TODO: rule for identifiers */
/* TODO: rule for whitespace — skip */
/* TODO: catch-all for other single characters */
%%
int main() {
    yylex();
    return 0;
}`,
      driverPostCode: '',
      answer:
`%option noyywrap
%%
[0-9]+               { printf("INT:%s\\n", yytext); }
[a-zA-Z_][a-zA-Z0-9_]* { printf("ID:%s\\n", yytext); }
[ \\t\\n]+             { /* skip whitespace */ }
.                    { printf("OTHER:%s\\n", yytext); }
%%
int main() {
    yylex();
    return 0;
}`,
      isAnswerVisible: false,
      hideTestCases: false,
      testCases: [
        { label: 'Mixed tokens',       input: 'x1 42 a_b !',    expectedOutput: 'ID:x1\nINT:42\nID:a_b\nOTHER:!', isHidden: false },
        { label: 'Numbers only',       input: '10 200 3',        expectedOutput: 'INT:10\nINT:200\nINT:3',          isHidden: false },
        { label: 'Identifiers only',   input: 'foo bar_baz',     expectedOutput: 'ID:foo\nID:bar_baz',             isHidden: true  },
        { label: 'Punctuation',        input: 'a + b',           expectedOutput: 'ID:a\nOTHER:+\nID:b',           isHidden: true  },
      ],
    },

    /* ── Flex Q4: Count Lines, Words, Characters ── */
    {
      title: 'Line, Word and Character Count',
      description:
`Implement a mini version of the Unix \`wc\` command.\n\nYour Flex lexer should read input and print exactly three space-separated numbers:\n\`<lines> <words> <chars>\`\n\n- **Lines**: count of newline characters\n- **Words**: sequences of non-whitespace characters\n- **Chars**: every character including newlines\n\nExample — input (3 lines):\n\`\`\`\nhello world\nfoo\nbar baz\n\`\`\`\n→ output: \`3 4 22\``,
      language: 'flex',
      difficulty: 'medium',
      driverPreCode: '',
      placeholderCode:
`%option noyywrap
%{
    /* TODO: declare counters for lines, words, chars */
%}
%%
/* TODO: rule for newlines — increment lines and chars */
/* TODO: rule for words (non-whitespace sequences) — increment words and chars */
/* TODO: rule for other whitespace — just add to chars */
%%
int main() {
    yylex();
    /* TODO: print the three counts */
    return 0;
}`,
      driverPostCode: '',
      answer:
`%option noyywrap
%{
    int lines = 0, words = 0, chars = 0;
%}
%%
\\n             { lines++; chars++; }
[^ \\t\\n]+     { words++; chars += yyleng; }
[ \\t]          { chars++; }
%%
int main() {
    yylex();
    printf("%d %d %d\\n", lines, words, chars);
    return 0;
}`,
      isAnswerVisible: false,
      hideTestCases: false,
      testCases: [
        { label: 'Three lines',    input: 'hello world\nfoo\nbar baz\n', expectedOutput: '3 4 22', isHidden: false },
        { label: 'Single word',    input: 'hi\n',                         expectedOutput: '1 1 3',  isHidden: false },
        { label: 'Empty input',    input: '\n',                            expectedOutput: '1 0 1',  isHidden: true  },
        { label: 'Multiple spaces',input: 'a  b\nc\n',                    expectedOutput: '2 3 8',  isHidden: true  },
      ],
    },
  ];

  let added = 0;
  for (const q of questions) {
    // Create question
    const created = (await api.post(`${BASE}/sessions/${s2._id}/questions`, q)).data;
    console.log(`  ✓ ${created.title}`);
    added++;
  }
  console.log(`\nDone — added ${added} Flex questions to "${s2.name}"`);
}

main().catch(e => {
  if (e.code === 'ECONNREFUSED') {
    console.error('Backend not running. Start it first: node src/server.js');
  } else {
    console.error(e.response?.data || e.message);
  }
  process.exit(1);
});
