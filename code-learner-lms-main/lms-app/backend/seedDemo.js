/**
 * seedDemo.js — Full demo course with all 10 languages, 3 sessions:
 *
 *   Session 1 – "Lab 1: Fundamentals" (open, not timed)
 *     • C         — Sum of two numbers       (pre+post, answer shown, all visible TCs)
 *     • C++       — Factorial                (pre+post, mix hidden/visible TCs)
 *     • Python    — Fibonacci                (pre+post, all visible TCs)
 *     • Java      — Palindrome check         (pre+post, all hidden TCs, max 3 attempts)
 *     • JavaScript— Array sum                (pre+post, mix hidden/visible)
 *
 *   Session 2 – "Lab 2: Exam (Timed 45 min)" (timed, inactive — flip isActive to start)
 *     • C#        — String reverse           (pre+post, hidden TCs, max 2 attempts)
 *     • Ruby      — Count vowels             (pre+post, mix hidden/visible)
 *     • MIPS      — Print 1 to N             (standalone, visible TCs)
 *     • Flex      — Count words              (standalone, visible TCs)
 *
 *   Session 3 – "Lab 3: SQL Workshop" (open, not timed)
 *     • SQL Q1    — SELECT with WHERE        (table in input, answer shown, visible)
 *     • SQL Q2    — JOIN query               (2 tables in input, hidden TCs)
 *     • SQL Q3    — GROUP BY aggregate       (table in input, mix hidden/visible)
 *
 * Run:   node seedDemo.js
 * Safe to re-run — skips existing accounts, reuses existing course.
 */

const axios = require('axios');
const BASE = 'http://localhost:5001/api';

/* ── Accounts ────────────────────────────────────────────────────────────── */
const TEACHER  = { username: 'demo_teacher',  password: 'teacher123', name: 'Demo Teacher', role: 'teacher' };
const STUDENTS = [
  { username: 'student_alice', password: 'student123', name: 'Alice Varma',  role: 'student', rollNumber: '22CS001' },
  { username: 'student_bob',   password: 'student123', name: 'Bob Rajan',    role: 'student', rollNumber: '22CS002' },
];
const COURSE = { name: 'CS201 – Programming Lab Demo', description: 'Full demo with all 10 languages.', password: 'lab2024' };

/* ── Helpers ─────────────────────────────────────────────────────────────── */
async function registerOrLogin(user) {
  try {
    const r = await axios.post(`${BASE}/auth/register`, user);
    return r.data.token;
  } catch (e) {
    if (e.response?.status === 409) {
      const r = await axios.post(`${BASE}/auth/login`, { username: user.username, password: user.password });
      return r.data.token;
    }
    throw e;
  }
}

function api(token) {
  return axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` } });
}

async function addQ(teacherApi, sessionId, q) {
  const r = await teacherApi.post(`/sessions/${sessionId}/questions`, q);
  process.stdout.write(`    ✓ ${q.title}\n`);
  return r.data.question;
}

/* ── Question definitions ────────────────────────────────────────────────── */
const SESSION1_QUESTIONS = [

  /* ── C ── */
  {
    title: 'Sum of Two Numbers',
    description: `Implement the function \`sum(a, b)\` that returns the sum of two integers.\n\nThe driver code reads two integers from stdin and prints the result — you only need to write the function body.`,
    language: 'c',
    difficulty: 'easy',
    driverPreCode:
`#include <stdio.h>

/* ---- driver: do not edit ---- */
int sum(int a, int b);   /* your function is declared here */

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", sum(a, b));
    return 0;
}
/* ---- write your solution below ---- */`,
    placeholderCode:
`int sum(int a, int b) {
    // TODO: return a + b
    return 0;
}`,
    driverPostCode: '',
    answer: `int sum(int a, int b) {\n    return a + b;\n}`,
    isAnswerVisible: true,
    hideTestCases: false,
    testCases: [
      { label: 'Example 1',  input: '3 5',   expectedOutput: '8',  isHidden: false },
      { label: 'Example 2',  input: '10 -4', expectedOutput: '6',  isHidden: false },
      { label: 'Edge: zeros',input: '0 0',   expectedOutput: '0',  isHidden: false },
      { label: 'Hidden: large', input: '1000000 999999', expectedOutput: '1999999', isHidden: true },
    ],
  },

  /* ── C++ ── */
  {
    title: 'Factorial',
    description: `Implement \`factorial(n)\` that returns n! (n factorial).\n\nRemember: 0! = 1, 1! = 1, 5! = 120.\n\nThe driver reads n and prints the result.`,
    language: 'cpp',
    difficulty: 'easy',
    driverPreCode:
`#include <iostream>
using namespace std;

/* ---- driver: do not edit ---- */
long long factorial(int n);

int main() {
    int n;
    cin >> n;
    cout << factorial(n) << endl;
    return 0;
}
/* ---- write your solution below ---- */`,
    placeholderCode:
`long long factorial(int n) {
    // TODO: compute n!
    return 0;
}`,
    driverPostCode: '',
    answer: `long long factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}`,
    isAnswerVisible: false,
    hideTestCases: false,
    testCases: [
      { label: 'n=5',       input: '5',  expectedOutput: '120',      isHidden: false },
      { label: 'n=0',       input: '0',  expectedOutput: '1',        isHidden: false },
      { label: 'n=1',       input: '1',  expectedOutput: '1',        isHidden: false },
      { label: 'n=10 (hidden)', input: '10', expectedOutput: '3628800', isHidden: true },
      { label: 'n=12 (hidden)', input: '12', expectedOutput: '479001600', isHidden: true },
    ],
  },

  /* ── Python ── */
  {
    title: 'Fibonacci Number',
    description: `Implement \`fibonacci(n)\` that returns the nth Fibonacci number (0-indexed).\n\nfib(0)=0, fib(1)=1, fib(2)=1, fib(3)=2, fib(6)=8\n\nThe driver reads n from stdin and prints fibonacci(n).`,
    language: 'python',
    difficulty: 'easy',
    driverPreCode: '# --- driver: do not edit ---',
    placeholderCode:
`def fibonacci(n):
    # TODO: return the nth Fibonacci number
    pass`,
    driverPostCode:
`

# --- driver: do not edit ---
n = int(input())
print(fibonacci(n))`,
    answer: `def fibonacci(n):\n    if n <= 0: return 0\n    if n == 1: return 1\n    return fibonacci(n-1) + fibonacci(n-2)`,
    isAnswerVisible: false,
    hideTestCases: false,
    testCases: [
      { label: 'fib(0)',  input: '0',  expectedOutput: '0',  isHidden: false },
      { label: 'fib(1)',  input: '1',  expectedOutput: '1',  isHidden: false },
      { label: 'fib(6)',  input: '6',  expectedOutput: '8',  isHidden: false },
      { label: 'fib(10) hidden', input: '10', expectedOutput: '55', isHidden: true },
    ],
  },

  /* ── Java ── */
  {
    title: 'Palindrome Check',
    description: `Implement the body of \`isPalindrome(s)\` — return \`true\` if \`s\` reads the same forwards and backwards, \`false\` otherwise.\n\nAll test cases are hidden. The driver reads one word and prints "yes" or "no".`,
    language: 'java',
    difficulty: 'medium',
    maxAttempts: 3,
    driverPreCode:
`import java.util.Scanner;

public class Main {
    /* ---- write your solution in the method below ---- */
    public static boolean isPalindrome(String s) {`,
    placeholderCode:
`        // TODO: return true if s is a palindrome
        return false;`,
    driverPostCode:
`    }

    /* ---- driver: do not edit ---- */
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        System.out.println(isPalindrome(s) ? "yes" : "no");
    }
}`,
    answer: `        String rev = new StringBuilder(s).reverse().toString();\n        return s.equals(rev);`,
    isAnswerVisible: false,
    hideTestCases: true,
    testCases: [
      { label: 'racecar',  input: 'racecar', expectedOutput: 'yes', isHidden: true },
      { label: 'hello',    input: 'hello',   expectedOutput: 'no',  isHidden: true },
      { label: 'madam',    input: 'madam',   expectedOutput: 'yes', isHidden: true },
      { label: 'java',     input: 'java',    expectedOutput: 'no',  isHidden: true },
      { label: 'a',        input: 'a',       expectedOutput: 'yes', isHidden: true },
    ],
  },

  /* ── JavaScript ── */
  {
    title: 'Array Sum',
    description: `Implement \`arraySum(arr)\` that returns the sum of all numbers in the array.\n\nThe driver reads space-separated numbers from stdin, builds the array, and prints the result.`,
    language: 'javascript',
    difficulty: 'easy',
    driverPreCode:
`/* ---- driver: do not edit ---- */
const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const arr = lines[0].split(' ').map(Number);

/* ---- write your solution below ---- */`,
    placeholderCode:
`function arraySum(arr) {
    // TODO: return the sum of all elements
    return 0;
}`,
    driverPostCode:
`
/* ---- driver: do not edit ---- */
console.log(arraySum(arr));`,
    answer: `function arraySum(arr) {\n    return arr.reduce((s, x) => s + x, 0);\n}`,
    isAnswerVisible: false,
    hideTestCases: false,
    testCases: [
      { label: 'Positive',  input: '1 2 3 4 5',  expectedOutput: '15', isHidden: false },
      { label: 'Mixed',     input: '10 -5 3',     expectedOutput: '8',  isHidden: false },
      { label: 'All neg (hidden)', input: '-1 -2 -3', expectedOutput: '-6', isHidden: true },
      { label: 'Single (hidden)',  input: '42',        expectedOutput: '42', isHidden: true },
    ],
  },
];

const SESSION2_QUESTIONS = [

  /* ── C# ── */
  {
    title: 'Reverse a String',
    description: `Implement \`Reverse(s)\` that returns the string \`s\` reversed.\n\nAll test cases are hidden. Maximum **2 attempts** — think before you submit!`,
    language: 'csharp',
    difficulty: 'easy',
    maxAttempts: 2,
    driverPreCode:
`using System;

class Solution {
    /* ---- write your solution below ---- */
    static string Reverse(string s) {`,
    placeholderCode:
`        // TODO: return the reversed string
        return "";`,
    driverPostCode:
`    }

    /* ---- driver: do not edit ---- */
    static void Main() {
        string s = Console.ReadLine();
        Console.WriteLine(Reverse(s));
    }
}`,
    answer: `        char[] chars = s.ToCharArray();\n        Array.Reverse(chars);\n        return new string(chars);`,
    isAnswerVisible: false,
    hideTestCases: true,
    testCases: [
      { label: 'hello',    input: 'hello',   expectedOutput: 'olleh',   isHidden: true },
      { label: 'abcde',    input: 'abcde',   expectedOutput: 'edcba',   isHidden: true },
      { label: 'racecar',  input: 'racecar', expectedOutput: 'racecar', isHidden: true },
      { label: 'a',        input: 'a',       expectedOutput: 'a',       isHidden: true },
    ],
  },

  /* ── Ruby ── */
  {
    title: 'Count Vowels',
    description: `Implement \`count_vowels(s)\` that returns the number of vowels (a, e, i, o, u — case-insensitive) in the string.\n\nThe driver reads one line and prints the count.`,
    language: 'ruby',
    difficulty: 'easy',
    driverPreCode: '# ---- write your solution below ----',
    placeholderCode:
`def count_vowels(s)
  # TODO: count vowels in s (case-insensitive)
  0
end`,
    driverPostCode:
`
# ---- driver: do not edit ----
puts count_vowels(gets.chomp)`,
    answer: `def count_vowels(s)\n  s.downcase.count('aeiou')\nend`,
    isAnswerVisible: false,
    hideTestCases: false,
    testCases: [
      { label: 'Hello World', input: 'Hello World', expectedOutput: '3',  isHidden: false },
      { label: 'aeiou',       input: 'aeiou',       expectedOutput: '5',  isHidden: false },
      { label: 'rhythm (hidden)',input: 'rhythm',    expectedOutput: '0',  isHidden: true },
      { label: 'Programming (hidden)', input: 'Programming', expectedOutput: '3', isHidden: true },
    ],
  },

  /* ── MIPS ── */
  {
    title: 'Print 1 to N',
    description: `Write a MIPS assembly program that reads an integer N from stdin and prints each number from 1 to N on a separate line.\n\nThis is standalone MIPS — no driver code. Write the complete program.\n\nSyscall reference: \`$v0=5\` read int, \`$v0=1\` print int, \`$v0=4\` print string, \`$v0=10\` exit.`,
    language: 'mips',
    difficulty: 'medium',
    driverPreCode: '',
    placeholderCode:
`.data
    newline: .asciiz "\\n"

.text
main:
    # Read N
    li   $v0, 5
    syscall
    move $t0, $v0     # $t0 = N

    li   $t1, 1       # counter = 1
loop:
    # TODO: print $t1, then newline, then increment $t1
    # Exit when $t1 > $t0
    # Hint: bgt $t1, $t0, done

    li   $v0, 10
    syscall
done:
    li   $v0, 10
    syscall`,
    driverPostCode: '',
    answer:
`.data
    newline: .asciiz "\\n"
.text
main:
    li $v0, 5
    syscall
    move $t0, $v0
    li $t1, 1
loop:
    bgt $t1, $t0, done
    li $v0, 1
    move $a0, $t1
    syscall
    li $v0, 4
    la $a0, newline
    syscall
    addi $t1, $t1, 1
    j loop
done:
    li $v0, 10
    syscall`,
    isAnswerVisible: false,
    hideTestCases: false,
    testCases: [
      { label: 'N=3', input: '3', expectedOutput: '1\n2\n3',     isHidden: false },
      { label: 'N=5', input: '5', expectedOutput: '1\n2\n3\n4\n5', isHidden: false },
      { label: 'N=1 (hidden)', input: '1', expectedOutput: '1', isHidden: true },
    ],
  },

  /* ── Flex ── */
  {
    title: 'Count Words',
    description: `Write a Flex/Lex program that counts the number of words in its input and prints the count.\n\nA "word" is any sequence of alphabetic characters (a-z, A-Z).\n\nThis is standalone Flex — write the complete .l file including %%, rules, and main().`,
    language: 'flex',
    difficulty: 'medium',
    driverPreCode: '',
    placeholderCode:
`%{
int words = 0;
%}
%option noyywrap
%%
[a-zA-Z]+  { words++; }      /* count each word */
.          { /* skip */  }   /* ignore everything else */
\\n         { /* skip */  }
%%
int main() {
    yylex();
    /* TODO: print the word count */
    return 0;
}`,
    driverPostCode: '',
    answer:
`%{
int words = 0;
%}
%option noyywrap
%%
[a-zA-Z]+  { words++; }
.          { }
\\n         { }
%%
int main() {
    yylex();
    printf("%d\\n", words);
    return 0;
}`,
    isAnswerVisible: false,
    hideTestCases: false,
    testCases: [
      { label: '3 words',  input: 'hello world foo',      expectedOutput: '3', isHidden: false },
      { label: '4 words',  input: 'the quick brown fox',  expectedOutput: '4', isHidden: false },
      { label: 'with nums (hidden)', input: 'cat 42 dog 99 bird', expectedOutput: '3', isHidden: true },
    ],
  },
];

const SESSION3_QUESTIONS = [

  /* ── SQL Q1: SELECT with WHERE ── */
  {
    title: 'Find High-Scoring Students',
    description:
`The \`students\` table has columns: \`id\` (integer), \`name\` (text), \`grade\` (integer).\n\nWrite a SELECT query to return the **name** and **grade** of all students whose grade is **above 80**, sorted by grade **descending**.\n\nExpected output format (pipe-separated, SQLite default):\n\`\`\`\nEve|95\nAlice|92\nCarol|88\n\`\`\`\n\nThe answer is shown — study it before trying other SQL questions.`,
    language: 'sql',
    difficulty: 'easy',
    driverPreCode: '',
    placeholderCode: `-- Write a SELECT query to find all students with grade > 80
-- Return: name, grade — sorted by grade DESC
SELECT name, grade
FROM students
WHERE grade > 80
ORDER BY grade DESC;`,
    driverPostCode: '',
    answer: `SELECT name, grade\nFROM students\nWHERE grade > 80\nORDER BY grade DESC;`,
    isAnswerVisible: true,
    hideTestCases: false,
    testCases: [
      {
        label: 'Standard data',
        input:
`CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name TEXT,
    grade INTEGER
);
INSERT INTO students VALUES (1, 'Alice',  92);
INSERT INTO students VALUES (2, 'Bob',    75);
INSERT INTO students VALUES (3, 'Carol',  88);
INSERT INTO students VALUES (4, 'David',  65);
INSERT INTO students VALUES (5, 'Eve',    95);`,
        appendSql: '',
        expectedOutput: 'Eve|95\nAlice|92\nCarol|88',
        isHidden: false,
      },
      {
        label: 'All below 80 (hidden)',
        input:
`CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name TEXT,
    grade INTEGER
);
INSERT INTO students VALUES (1, 'Alice', 70);
INSERT INTO students VALUES (2, 'Bob',   65);`,
        appendSql: '',
        expectedOutput: '',
        isHidden: true,
      },
    ],
  },

  /* ── SQL Q2: JOIN ── */
  {
    title: 'Customer Orders JOIN',
    description:
`You have two tables:\n\n**customers**: \`id\`, \`name\`\n**orders**: \`id\`, \`customer_id\`, \`amount\`\n\nWrite a query to return the **customer name** and **order amount** for all orders where amount > 100, sorted by amount **descending**.\n\nAll test cases are hidden.`,
    language: 'sql',
    difficulty: 'medium',
    driverPreCode: '',
    placeholderCode:
`-- Join customers and orders
-- Return: name, amount where amount > 100, sorted by amount DESC
SELECT c.name, o.amount
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.amount > 100
ORDER BY o.amount DESC;`,
    driverPostCode: '',
    answer: `SELECT c.name, o.amount\nFROM customers c\nJOIN orders o ON c.id = o.customer_id\nWHERE o.amount > 100\nORDER BY o.amount DESC;`,
    isAnswerVisible: false,
    hideTestCases: true,
    testCases: [
      {
        label: 'Standard JOIN (hidden)',
        input:
`CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT
);
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    amount INTEGER
);
INSERT INTO customers VALUES (1, 'Alice');
INSERT INTO customers VALUES (2, 'Bob');
INSERT INTO customers VALUES (3, 'Carol');
INSERT INTO orders VALUES (1, 1, 250);
INSERT INTO orders VALUES (2, 2, 80);
INSERT INTO orders VALUES (3, 1, 150);
INSERT INTO orders VALUES (4, 3, 300);
INSERT INTO orders VALUES (5, 2, 120);`,
        appendSql: '',
        expectedOutput: 'Carol|300\nAlice|250\nAlice|150\nBob|120',
        isHidden: true,
      },
      {
        label: 'No qualifying orders (hidden)',
        input:
`CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount INTEGER);
INSERT INTO customers VALUES (1, 'Alice');
INSERT INTO orders VALUES (1, 1, 50);
INSERT INTO orders VALUES (2, 1, 30);`,
        appendSql: '',
        expectedOutput: '',
        isHidden: true,
      },
    ],
  },

  /* ── SQL Q3: GROUP BY ── */
  {
    title: 'Total Sales by Product',
    description:
`The \`sales\` table has columns: \`id\`, \`product\` (text), \`region\` (text), \`amount\` (integer).\n\nWrite a query to return the **product** name and its **total sales** (\`SUM(amount)\`), grouped by product, sorted alphabetically by product name.\n\nColumn alias: use \`total\` for the sum.\n\nOne test case is visible, two are hidden.`,
    language: 'sql',
    difficulty: 'medium',
    driverPreCode: '',
    placeholderCode:
`-- Return: product, total (SUM of amount) grouped by product, sorted by product ASC
SELECT product, SUM(amount) AS total
FROM sales
GROUP BY product
ORDER BY product ASC;`,
    driverPostCode: '',
    answer: `SELECT product, SUM(amount) AS total\nFROM sales\nGROUP BY product\nORDER BY product ASC;`,
    isAnswerVisible: false,
    hideTestCases: false,
    testCases: [
      {
        label: 'Three products',
        input:
`CREATE TABLE sales (
    id INTEGER PRIMARY KEY,
    product TEXT,
    region TEXT,
    amount INTEGER
);
INSERT INTO sales VALUES (1, 'Keyboard', 'North', 200);
INSERT INTO sales VALUES (2, 'Mouse',    'South', 150);
INSERT INTO sales VALUES (3, 'Keyboard', 'South', 300);
INSERT INTO sales VALUES (4, 'Monitor',  'North', 500);
INSERT INTO sales VALUES (5, 'Mouse',    'North', 100);
INSERT INTO sales VALUES (6, 'Monitor',  'South', 400);`,
        appendSql: '',
        expectedOutput: 'Keyboard|500\nMonitor|900\nMouse|250',
        isHidden: false,
      },
      {
        label: 'Single row per product (hidden)',
        input:
`CREATE TABLE sales (id INTEGER PRIMARY KEY, product TEXT, region TEXT, amount INTEGER);
INSERT INTO sales VALUES (1, 'Pen',    'A', 10);
INSERT INTO sales VALUES (2, 'Pencil', 'B', 20);`,
        appendSql: '',
        expectedOutput: 'Pen|10\nPencil|20',
        isHidden: true,
      },
      {
        label: 'Duplicate regions (hidden)',
        input:
`CREATE TABLE sales (id INTEGER PRIMARY KEY, product TEXT, region TEXT, amount INTEGER);
INSERT INTO sales VALUES (1, 'Widget', 'A', 100);
INSERT INTO sales VALUES (2, 'Widget', 'B', 200);
INSERT INTO sales VALUES (3, 'Widget', 'C', 300);`,
        appendSql: '',
        expectedOutput: 'Widget|600',
        isHidden: true,
      },
    ],
  },
];

/* ── Main runner ─────────────────────────────────────────────────────────── */
async function run() {
  console.log('\n🌱 Demo seed starting...\n');

  // Accounts
  console.log('👤 Setting up accounts...');
  const teacherToken = await registerOrLogin(TEACHER);
  const teacherApi   = api(teacherToken);
  console.log(`   ✓ Teacher: ${TEACHER.username} / ${TEACHER.password}`);

  for (const s of STUDENTS) {
    await registerOrLogin(s);
    console.log(`   ✓ Student: ${s.username} / ${s.password}  (roll: ${s.rollNumber})`);
  }

  // Course
  console.log('\n📚 Creating course...');
  let course;
  try {
    const r = await teacherApi.post('/courses', {
      name: COURSE.name, description: COURSE.description, password: COURSE.password,
    });
    course = r.data;
    console.log(`   ✓ Created "${course.name}"  code: ${course.code}`);
  } catch (e) {
    if (e.response?.status === 409 || e.response?.status === 400) {
      const r = await teacherApi.get('/courses/mine');
      course = r.data.find(c => c.name === COURSE.name) || r.data[0];
      console.log(`   ↺ Reusing "${course.name}"  code: ${course.code}`);
    } else throw e;
  }

  // Enroll students
  console.log('\n🎓 Enrolling students...');
  for (const s of STUDENTS) {
    const studentToken = await registerOrLogin(s);
    const studentApi   = api(studentToken);
    try {
      await studentApi.post('/courses/enroll', {
        code: course.code, password: COURSE.password, rollNumber: s.rollNumber,
      });
      console.log(`   ✓ Enrolled ${s.username}`);
    } catch (e) {
      if (e.response?.status === 409) console.log(`   ↺ ${s.username} already enrolled`);
      else throw e;
    }
  }

  const cid = course.code;

  // Session 1 — Fundamentals (open)
  console.log('\n📋 Session 1: Lab 1 – Fundamentals (open, not timed)');
  const s1 = (await teacherApi.post('/sessions', {
    name: 'Lab 1 – Core Languages', courseId: cid,
    description: 'C, C++, Python, Java, JavaScript — with driver pre/post code.',
    isTimed: false, durationMinutes: 0,
  })).data;
  // Mark active
  await teacherApi.put(`/sessions/${s1._id}`, { isActive: true });
  for (const q of SESSION1_QUESTIONS) await addQ(teacherApi, s1._id, q);

  // Session 2 — Timed exam (inactive)
  console.log('\n📋 Session 2: Lab 2 – Exam (timed 45 min, currently INACTIVE)');
  const s2 = (await teacherApi.post('/sessions', {
    name: 'Lab 2 – Exam (Timed)', courseId: cid,
    description: 'C#, Ruby, MIPS, Flex. Flip the Active toggle when ready to start.',
    isTimed: true, durationMinutes: 45,
  })).data;
  // Leave inactive — teacher flips it when the exam starts
  for (const q of SESSION2_QUESTIONS) await addQ(teacherApi, s2._id, q);

  // Session 3 — SQL (open)
  console.log('\n📋 Session 3: Lab 3 – SQL Workshop (open, not timed)');
  const s3 = (await teacherApi.post('/sessions', {
    name: 'Lab 3 – SQL Workshop', courseId: cid,
    description: 'SELECT, JOIN, GROUP BY — table setup is inside each test case.',
    isTimed: false, durationMinutes: 0,
  })).data;
  await teacherApi.put(`/sessions/${s3._id}`, { isActive: true });
  for (const q of SESSION3_QUESTIONS) await addQ(teacherApi, s3._id, q);

  // Summary
  console.log('\n✅ Done!\n');
  console.log('━'.repeat(52));
  console.log('  TEACHER');
  console.log(`    username : ${TEACHER.username}`);
  console.log(`    password : ${TEACHER.password}`);
  console.log('');
  console.log('  STUDENTS');
  for (const s of STUDENTS) {
    console.log(`    username : ${s.username}  password: ${s.password}  roll: ${s.rollNumber}`);
  }
  console.log('');
  console.log('  COURSE');
  console.log(`    code     : ${course.code}`);
  console.log(`    password : ${COURSE.password}`);
  console.log('');
  console.log('  SESSIONS');
  console.log(`    Lab 1 (C, C++, Python, Java, JS)  — ACTIVE`);
  console.log(`    Lab 2 (C#, Ruby, MIPS, Flex)      — inactive (timed 45 min)`);
  console.log(`    Lab 3 (SQL ×3)                    — ACTIVE`);
  console.log('━'.repeat(52));
  console.log('\nTip: toggle Lab 2 active in the Teacher Dashboard when ready to run the exam.\n');
}

run().catch(err => {
  console.error('\n❌ Seed failed:');
  if (err.code === 'ECONNREFUSED') {
    console.error('  Cannot connect to backend — make sure it is running:');
    console.error('  cd lms-app/backend && npm start');
  } else if (err.response) {
    console.error('  Status:', err.response.status);
    console.error('  Body:  ', JSON.stringify(err.response.data, null, 2));
  } else {
    console.error('  Error: ', err.message || err);
  }
  process.exit(1);
});
