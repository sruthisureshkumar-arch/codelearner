/**
 * seedQuestions.js — add one question per language to course S2007
 * Run: node seedQuestions.js
 */
const axios = require('axios');
const BASE = 'http://localhost:5001/api';

const TEACHER = { username: 'sruthi', password: '123456' };
const COURSE_CODE = 'S2007';

const QUESTIONS = [
  {
    language: 'c',
    title: 'Sum of Two Numbers (C)',
    description: 'Read two integers from stdin and print their sum.',
    difficulty: 'easy',
    placeholderCode: `#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    // TODO: print a + b\n    return 0;\n}`,
    testCases: [
      { label: 'Basic', input: '3 5', expectedOutput: '8' },
      { label: 'Negatives', input: '-2 7', expectedOutput: '5' },
      { label: 'Zeros', input: '0 0', expectedOutput: '0' },
    ],
  },
  {
    language: 'cpp',
    title: 'Reverse a String (C++)',
    description: 'Read a string and print it reversed.',
    difficulty: 'easy',
    placeholderCode: `#include <iostream>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    // TODO: reverse and print s\n    return 0;\n}`,
    testCases: [
      { label: 'Basic', input: 'hello', expectedOutput: 'olleh' },
      { label: 'Single char', input: 'a', expectedOutput: 'a' },
      { label: 'Palindrome', input: 'racecar', expectedOutput: 'racecar' },
    ],
  },
  {
    language: 'python',
    title: 'Factorial (Python)',
    description: 'Read a non-negative integer n and print n! (factorial).',
    difficulty: 'easy',
    placeholderCode: `n = int(input())\n# TODO: compute and print factorial of n`,
    testCases: [
      { label: 'Zero', input: '0', expectedOutput: '1' },
      { label: 'Five', input: '5', expectedOutput: '120' },
      { label: 'Ten', input: '10', expectedOutput: '3628800' },
    ],
  },
  {
    language: 'java',
    title: 'Check Even or Odd (Java)',
    description: 'Read an integer and print "Even" or "Odd".',
    difficulty: 'easy',
    placeholderCode: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // TODO: print Even or Odd\n    }\n}`,
    testCases: [
      { label: 'Even', input: '4', expectedOutput: 'Even' },
      { label: 'Odd', input: '7', expectedOutput: 'Odd' },
      { label: 'Zero', input: '0', expectedOutput: 'Even' },
    ],
  },
  {
    language: 'javascript',
    title: 'FizzBuzz (JavaScript)',
    description: 'Read a number n and print numbers 1 to n. For multiples of 3 print "Fizz", multiples of 5 print "Buzz", multiples of both print "FizzBuzz".',
    difficulty: 'easy',
    placeholderCode: `const n = parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());\n// TODO: FizzBuzz from 1 to n`,
    testCases: [
      { label: 'Up to 5', input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz' },
      { label: 'Up to 15', input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
    ],
  },
  {
    language: 'sql',
    title: 'Find Students Above Average (SQL)',
    description: 'Given a table students(id INT, name VARCHAR(50), score INT), find the names of all students whose score is above the average score. Order by name ascending.',
    difficulty: 'medium',
    placeholderCode: `-- TODO: select names of students with score above average\nSELECT name FROM students WHERE score > (SELECT AVG(score) FROM students) ORDER BY name;`,
    testCases: [
      {
        label: 'Basic',
        input: `CREATE TABLE students (id INT, name VARCHAR(50), score INT);\nINSERT INTO students VALUES (1,'Alice',90),(2,'Bob',60),(3,'Carol',75),(4,'Dave',85);`,
        expectedOutput: 'Alice\nDave',
        appendSql: 'SELECT name FROM students WHERE score > (SELECT AVG(score) FROM students) ORDER BY name;',
      },
    ],
  },
  {
    language: 'mips',
    title: 'Print Hello World (MIPS)',
    description: 'Write a MIPS assembly program that prints "Hello, World!" to stdout.',
    difficulty: 'easy',
    placeholderCode: `.data\n    msg: .asciiz "Hello, World!"\n\n.text\nmain:\n    li $v0, 4\n    la $a0, msg\n    syscall\n    li $v0, 10\n    syscall`,
    testCases: [
      { label: 'Output', input: '', expectedOutput: 'Hello, World!' },
    ],
  },
  {
    language: 'flex',
    title: 'Count Vowels (Flex/Lex)',
    description: 'Write a Flex lexer that counts the number of vowels (a, e, i, o, u — case insensitive) in the input and prints the count.',
    difficulty: 'medium',
    placeholderCode: `%option noyywrap\n\n%{\nint count = 0;\n%}\n\n%%\n[aeiouAEIOU]  { count++; }\n.             { /* skip */ }\n\\n            { /* skip */ }\n%%\n\nint main() {\n    yylex();\n    printf("%d\\n", count);\n    return 0;\n}`,
    testCases: [
      { label: 'Basic', input: 'hello world', expectedOutput: '3' },
      { label: 'All vowels', input: 'aeiou', expectedOutput: '5' },
      { label: 'Mixed case', input: 'Hello World', expectedOutput: '3' },
    ],
  },
];

async function run() {
  // Login as teacher
  console.log(`Logging in as ${TEACHER.username}...`);
  const loginRes = await axios.post(`${BASE}/auth/login`, TEACHER);
  const token = loginRes.data.token;
  const api = axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` } });

  // Find the course S2007
  console.log(`Looking up course ${COURSE_CODE}...`);
  const coursesRes = await api.get('/courses/mine');
  const course = coursesRes.data.find(c => c.code === COURSE_CODE);
  if (!course) {
    console.error(`Course ${COURSE_CODE} not found. Make sure you've created it first.`);
    process.exit(1);
  }
  console.log(`  Found: "${course.name}"`);

  // Find or create a session to put questions in
  const sessionsRes = await api.get(`/sessions/course/${COURSE_CODE}`);
  let session = sessionsRes.data.find(s => s.name === 'Language Sampler');
  if (!session) {
    console.log('Creating "Language Sampler" session...');
    const sessRes = await api.post('/sessions', {
      name: 'Language Sampler',
      description: 'One question for each supported language.',
      courseId: COURSE_CODE,
      isTimed: false,
      isActive: true,
    });
    session = sessRes.data;
    console.log(`  Created session: ${session._id}`);
  } else {
    console.log(`  Reusing existing session: ${session.name}`);
  }

  // Add each question to the session
  for (const q of QUESTIONS) {
    process.stdout.write(`  Adding [${q.language.toUpperCase()}] ${q.title}... `);
    try {
      await api.post(`/sessions/${session._id}/questions`, {
        ...q,
        courseId: COURSE_CODE,
        createdBy: TEACHER.username,
        hideTestCases: false,
      });
      console.log('✓');
    } catch (e) {
      console.log('✗', e.response?.data?.error || e.message);
    }
  }

  // Activate session if not already
  await api.put(`/sessions/${session._id}`, { isActive: true });

  console.log('\nDone! Session "Language Sampler" is active in course S2007.');
  console.log('Students enrolled in S2007 can now see and attempt all 8 questions.');
}

run().catch(err => {
  if (err.response) {
    console.error('Failed:', err.response.status, JSON.stringify(err.response.data));
  } else {
    console.error('Failed:', err.message || err);
  }
  process.exit(1);
});
