/**
 * seedQuestionsData.js — Shared question bank used by seed.js (legacy course-001)
 * and seedTestCourse.js (the "TestCourse" course).
 */

const questions = [

  /* ───────────── MIPS Assembly ───────────── */
  {
    title: 'MIPS: Print "Hello, World!"',
    description: 'Use syscall to print the string "Hello, World!" to stdout.',
    difficulty: 'easy',
    language: 'mips',
    testCases: [
      { label: 'Output check', input: '', expectedOutput: 'Hello, World!', isHidden: false },
    ],
    answer:
`.data
msg: .asciiz "Hello, World!\\n"
.text
main:
    li   $v0, 4
    la   $a0, msg
    syscall
    li   $v0, 10
    syscall`,
    placeholderCode:
`.data
    # define your string here

.text
main:
    # load and print the string
    li $v0, 10
    syscall`,
    isAnswerVisible: true,
  },
  {
    title: 'MIPS: Add two numbers',
    description: 'Load 5 into $t0 and 3 into $t1, add them into $t2, then print the result using syscall 1.',
    difficulty: 'easy',
    language: 'mips',
    testCases: [
      { label: 'Print sum (8)', input: '', expectedOutput: '8', isHidden: false },
    ],
    answer:
`.text
main:
    li  $t0, 5
    li  $t1, 3
    add $t2, $t0, $t1   # $t2 = 8
    li  $v0, 1
    move $a0, $t2
    syscall             # print 8
    li  $v0, 10
    syscall`,
    placeholderCode:
`.text
main:
    # load values into $t0 and $t1
    # add them into $t2
    li $v0, 10
    syscall`,
    isAnswerVisible: false,
  },

  /* ───────────── C ───────────── */
  {
    title: 'C: Hello World',
    description: 'Print "Hello, World!" followed by a newline.',
    difficulty: 'easy',
    language: 'c',
    testCases: [
      { label: 'Output check', input: '', expectedOutput: 'Hello, World!', isHidden: false },
    ],
    answer:
`#include <stdio.h>
int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
    placeholderCode:
`#include <stdio.h>
int main() {
    // your code here
    return 0;
}`,
    isAnswerVisible: true,
  },
  {
    title: 'C: Sum of two integers',
    description: 'Read two integers from stdin separated by a newline and print their sum.',
    difficulty: 'medium',
    language: 'c',
    testCases: [
      { label: 'Basic addition',  input: '3\n4',   expectedOutput: '7',  isHidden: false },
      { label: 'Negative number', input: '-5\n10', expectedOutput: '5',  isHidden: false },
      { label: 'Hidden case',     input: '100\n200', expectedOutput: '300', isHidden: true },
    ],
    answer:
`#include <stdio.h>
int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}`,
    placeholderCode:
`#include <stdio.h>
int main() {
    int a, b;
    // read a and b, then print sum
    return 0;
}`,
    isAnswerVisible: false,
  },

  /* ───────────── C++ ───────────── */
  {
    title: 'C++: Reverse a string',
    description: 'Read a single word from stdin and print it reversed.',
    difficulty: 'medium',
    language: 'cpp',
    testCases: [
      { label: 'hello → olleh', input: 'hello', expectedOutput: 'olleh', isHidden: false },
      { label: 'racecar',       input: 'racecar', expectedOutput: 'racecar', isHidden: false },
      { label: 'Hidden',        input: 'OpenAI', expectedOutput: 'IAnepO', isHidden: true },
    ],
    answer:
`#include <iostream>
#include <algorithm>
#include <string>
using namespace std;
int main() {
    string s;
    cin >> s;
    reverse(s.begin(), s.end());
    cout << s << endl;
    return 0;
}`,
    placeholderCode:
`#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    cin >> s;
    // reverse and print
    return 0;
}`,
    isAnswerVisible: false,
  },
  {
    title: 'C++: Check if number is prime',
    description: 'Read an integer n from stdin. Print "prime" if it is prime, otherwise "not prime".',
    difficulty: 'hard',
    language: 'cpp',
    testCases: [
      { label: '7 is prime',    input: '7',  expectedOutput: 'prime',     isHidden: false },
      { label: '1 is not prime',input: '1',  expectedOutput: 'not prime', isHidden: false },
      { label: '9 is not prime',input: '9',  expectedOutput: 'not prime', isHidden: false },
      { label: 'Hidden',        input: '97', expectedOutput: 'prime',     isHidden: true  },
    ],
    answer:
`#include <iostream>
using namespace std;
bool isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++)
        if (n % i == 0) return false;
    return true;
}
int main() {
    int n; cin >> n;
    cout << (isPrime(n) ? "prime" : "not prime") << endl;
    return 0;
}`,
    placeholderCode:
`#include <iostream>
using namespace std;
int main() {
    int n; cin >> n;
    // check if n is prime
    return 0;
}`,
    isAnswerVisible: false,
  },

  /* ───────────── Python ───────────── */
  {
    title: 'Python: FizzBuzz (1–15)',
    description: 'Print FizzBuzz for numbers 1 through 15. Print "Fizz" for multiples of 3, "Buzz" for 5, "FizzBuzz" for both.',
    difficulty: 'easy',
    language: 'python',
    testCases: [
      {
        label: 'Full output',
        input: '',
        expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        isHidden: false,
      },
    ],
    answer:
`for i in range(1, 16):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)`,
    placeholderCode:
`for i in range(1, 16):
    # your logic here
    pass`,
    isAnswerVisible: true,
  },
  {
    title: 'Python: Fibonacci sequence',
    description: 'Read integer n from stdin. Print the first n Fibonacci numbers, one per line.',
    difficulty: 'medium',
    language: 'python',
    testCases: [
      { label: 'n=5',  input: '5',  expectedOutput: '0\n1\n1\n2\n3', isHidden: false },
      { label: 'n=1',  input: '1',  expectedOutput: '0',             isHidden: false },
      { label: 'Hidden n=8', input: '8', expectedOutput: '0\n1\n1\n2\n3\n5\n8\n13', isHidden: true },
    ],
    answer:
`n = int(input())
a, b = 0, 1
for _ in range(n):
    print(a)
    a, b = b, a + b`,
    placeholderCode:
`n = int(input())
# print the first n Fibonacci numbers`,
    isAnswerVisible: false,
  },

  /* ───────────── Java ───────────── */
  {
    title: 'Java: Factorial',
    description: 'Read integer n from stdin and print n! (factorial).',
    difficulty: 'medium',
    language: 'java',
    testCases: [
      { label: '5! = 120',  input: '5',  expectedOutput: '120',  isHidden: false },
      { label: '0! = 1',    input: '0',  expectedOutput: '1',    isHidden: false },
      { label: 'Hidden 10!',input: '10', expectedOutput: '3628800', isHidden: true },
    ],
    answer:
`import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long fact = 1;
        for (int i = 2; i <= n; i++) fact *= i;
        System.out.println(fact);
    }
}`,
    placeholderCode:
`import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // compute and print factorial
    }
}`,
    isAnswerVisible: false,
  },
  {
    title: 'Java: Count vowels in a string',
    description: 'Read a word from stdin and print the number of vowels (a, e, i, o, u — case insensitive).',
    difficulty: 'easy',
    language: 'java',
    testCases: [
      { label: '"hello" → 2',   input: 'hello',  expectedOutput: '2', isHidden: false },
      { label: '"AEIOU" → 5',   input: 'AEIOU',  expectedOutput: '5', isHidden: false },
      { label: 'Hidden',        input: 'programming', expectedOutput: '3', isHidden: true },
    ],
    answer:
`import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next().toLowerCase();
        int count = 0;
        for (char c : s.toCharArray())
            if ("aeiou".indexOf(c) >= 0) count++;
        System.out.println(count);
    }
}`,
    placeholderCode:
`import java.util.Scanner;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        // count vowels and print
    }
}`,
    isAnswerVisible: false,
  },

  /* ───────────── JavaScript ───────────── */
  {
    title: 'JavaScript: Sum of array',
    description: 'Read a comma-separated list of numbers from stdin (e.g. "1,2,3") and print their sum.',
    difficulty: 'easy',
    language: 'javascript',
    testCases: [
      { label: '1,2,3 → 6',         input: '1,2,3',     expectedOutput: '6',   isHidden: false },
      { label: '10,20,30 → 60',      input: '10,20,30',  expectedOutput: '60',  isHidden: false },
      { label: 'Hidden negative',    input: '-5,5,10',   expectedOutput: '10',  isHidden: true  },
    ],
    answer:
`const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
    const nums = line.trim().split(',').map(Number);
    console.log(nums.reduce((a, b) => a + b, 0));
    rl.close();
});`,
    placeholderCode:
`const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
    const nums = line.trim().split(',').map(Number);
    // compute and print the sum
    rl.close();
});`,
    isAnswerVisible: true,
  },
  {
    title: 'JavaScript: Palindrome check',
    description: 'Read a word from stdin and print "true" if it is a palindrome, "false" otherwise.',
    difficulty: 'medium',
    language: 'javascript',
    testCases: [
      { label: '"racecar" → true',  input: 'racecar', expectedOutput: 'true',  isHidden: false },
      { label: '"hello" → false',   input: 'hello',   expectedOutput: 'false', isHidden: false },
      { label: 'Hidden',            input: 'level',   expectedOutput: 'true',  isHidden: true  },
    ],
    answer:
`const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
    const s = line.trim();
    console.log(s === s.split('').reverse().join('') ? 'true' : 'false');
    rl.close();
});`,
    placeholderCode:
`const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
    const s = line.trim();
    // check palindrome and print true/false
    rl.close();
});`,
    isAnswerVisible: false,
  },

  /* ───────────── C# ───────────── */
  {
    title: 'C#: Celsius to Fahrenheit',
    description: 'Read a Celsius temperature (integer) from stdin and print the Fahrenheit equivalent as an integer.',
    difficulty: 'easy',
    language: 'csharp',
    testCases: [
      { label: '0°C → 32°F',   input: '0',   expectedOutput: '32',  isHidden: false },
      { label: '100°C → 212°F',input: '100', expectedOutput: '212', isHidden: false },
      { label: 'Hidden -40',   input: '-40', expectedOutput: '-40', isHidden: true  },
    ],
    answer:
`using System;
class Solution {
    static void Main() {
        int c = int.Parse(Console.ReadLine());
        Console.WriteLine(c * 9 / 5 + 32);
    }
}`,
    placeholderCode:
`using System;
class Solution {
    static void Main() {
        int c = int.Parse(Console.ReadLine());
        // convert and print Fahrenheit
    }
}`,
    isAnswerVisible: true,
  },
  {
    title: 'C#: Count words in a sentence',
    description: 'Read a line of text from stdin and print the number of words (space-separated).',
    difficulty: 'medium',
    language: 'csharp',
    testCases: [
      { label: '"hello world" → 2',  input: 'hello world',            expectedOutput: '2', isHidden: false },
      { label: '3 words',            input: 'the quick brown',        expectedOutput: '3', isHidden: false },
      { label: 'Hidden',             input: 'one two three four five',expectedOutput: '5', isHidden: true  },
    ],
    answer:
`using System;
class Solution {
    static void Main() {
        string line = Console.ReadLine();
        Console.WriteLine(line.Trim().Split(new char[]{' '}, StringSplitOptions.RemoveEmptyEntries).Length);
    }
}`,
    placeholderCode:
`using System;
class Solution {
    static void Main() {
        string line = Console.ReadLine();
        // count and print number of words
    }
}`,
    isAnswerVisible: false,
  },

  /* ───────────── Ruby ───────────── */
  {
    title: 'Ruby: Square of a number',
    description: 'Read an integer from stdin and print its square.',
    difficulty: 'easy',
    language: 'ruby',
    testCases: [
      { label: '4 → 16',  input: '4',  expectedOutput: '16',  isHidden: false },
      { label: '0 → 0',   input: '0',  expectedOutput: '0',   isHidden: false },
      { label: 'Hidden',  input: '12', expectedOutput: '144', isHidden: true  },
    ],
    answer:
`n = gets.chomp.to_i
puts n * n`,
    placeholderCode:
`n = gets.chomp.to_i
# print the square of n`,
    isAnswerVisible: true,
  },
  {
    title: 'Ruby: Count characters in a string',
    description: 'Read a string from stdin and print its length.',
    difficulty: 'easy',
    language: 'ruby',
    testCases: [
      { label: '"hello" → 5',       input: 'hello',    expectedOutput: '5',  isHidden: false },
      { label: '"programming" → 11',input: 'programming', expectedOutput: '11', isHidden: false },
      { label: 'Hidden',            input: 'CS101',    expectedOutput: '5',  isHidden: true  },
    ],
    answer:
`s = gets.chomp
puts s.length`,
    placeholderCode:
`s = gets.chomp
# print the length of s`,
    isAnswerVisible: false,
  },

  /* ───────────── SQL ───────────── */
  // For SQL questions the test-case "input" field holds the setup SQL
  // (CREATE TABLE + INSERT statements). The system prepends it to the
  // student's query before sending to Judge0, so students only write
  // the query — they don't need to re-create the tables themselves.
  {
    title: 'SQL: Select all students',
    description: 'The `students` table (columns: `id` INTEGER, `name` TEXT) is already set up for you. Write a query to select all rows ordered by id.',
    difficulty: 'easy',
    language: 'sql',
    testCases: [
      {
        label: 'All rows ordered by id',
        input:
`CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO students VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Carol');`,
        expectedOutput: '1|Alice\n2|Bob\n3|Carol',
        isHidden: false,
      },
    ],
    answer: `SELECT id, name FROM students ORDER BY id;`,
    placeholderCode: `-- Write your SELECT query here:\n`,
    isAnswerVisible: true,
  },
  {
    title: 'SQL: Filter with WHERE (projection)',
    description: 'The `employees` table (columns: `id`, `name`, `department`) is already set up. Select only the `name` column for employees in the "Engineering" department, ordered alphabetically.',
    difficulty: 'easy',
    language: 'sql',
    testCases: [
      {
        label: 'Engineering employees',
        input:
`CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT);
INSERT INTO employees VALUES
  (1, 'Alice',  'Engineering'),
  (2, 'Bob',    'Marketing'),
  (3, 'Carol',  'Engineering'),
  (4, 'David',  'HR');`,
        expectedOutput: 'Alice\nCarol',
        isHidden: false,
      },
    ],
    answer: `SELECT name FROM employees WHERE department = 'Engineering' ORDER BY name;`,
    placeholderCode: `-- Select only names from Engineering, ordered alphabetically:\n`,
    isAnswerVisible: false,
  },
  {
    title: 'SQL: JOIN two tables',
    description: 'Two tables are set up: `customers` (id, name) and `orders` (id, customer_id, amount). Write a query to return each customer\'s name and their order amount, ordered by order id.',
    difficulty: 'medium',
    language: 'sql',
    testCases: [
      {
        label: 'Joined result',
        input:
`CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO customers VALUES (1, 'Alice'), (2, 'Bob');

CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount INTEGER);
INSERT INTO orders VALUES (1, 1, 150), (2, 2, 200), (3, 1, 90);`,
        expectedOutput: 'Alice|150\nBob|200\nAlice|90',
        isHidden: false,
      },
    ],
    answer:
`SELECT c.name, o.amount
FROM orders o
JOIN customers c ON o.customer_id = c.id
ORDER BY o.id;`,
    placeholderCode: `-- Join orders with customers and return name, amount ordered by order id:\n`,
    isAnswerVisible: false,
  },
  {
    title: 'SQL: CASCADE delete',
    description: `The \`departments\` table is already created and populated for you.

Your job:
1. Create the \`employees\` table with columns: id (INTEGER PRIMARY KEY), name (TEXT), dept_id (INTEGER), and a FOREIGN KEY on dept_id referencing departments(id) ON DELETE CASCADE.
2. Enable foreign key enforcement with: PRAGMA foreign_keys = ON;

The system will then insert employees, delete the Engineering department, and check that the cascade removed Alice and Carol automatically.`,
    difficulty: 'hard',
    language: 'sql',
    testCases: [
      {
        label: 'Employees after cascade delete',
        // Prepended before student code: departments table + data
        input:
`PRAGMA foreign_keys = ON;
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Marketing'), (3, 'HR');`,
        // Appended after student code: fixed inserts + delete + select
        appendSql:
`INSERT INTO employees VALUES (1,'Alice',1),(2,'Bob',2),(3,'Carol',1),(4,'David',3);
DELETE FROM departments WHERE name = 'Engineering';
SELECT e.name, d.name FROM employees e JOIN departments d ON e.dept_id = d.id ORDER BY e.id;`,
        expectedOutput: 'Bob|Marketing\nDavid|HR',
        isHidden: false,
      },
    ],
    answer:
`-- departments table is already set up for you.
-- Just create the employees table with CASCADE FK:
CREATE TABLE employees (
  id      INTEGER PRIMARY KEY,
  name    TEXT,
  dept_id INTEGER,
  FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE CASCADE
);`,
    placeholderCode:
`-- departments table is already set up for you.
-- Create the employees table with a CASCADE foreign key on dept_id:

CREATE TABLE employees (
  id      INTEGER PRIMARY KEY,
  name    TEXT,
  dept_id INTEGER,
  -- add your FOREIGN KEY constraint here
);`,
    isAnswerVisible: false,
  },
];

module.exports = questions;
