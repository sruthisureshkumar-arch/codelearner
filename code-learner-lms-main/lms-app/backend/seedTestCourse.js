/**
 * seedTestCourse.js — Create a course called "TestCourse" (teacher-administered,
 * enrollment password "teacher123") and load the full demo question bank
 * (mips/c/cpp/python/java/javascript/csharp/ruby) into it.
 *
 * Run:  node seedTestCourse.js
 * Requires the backend to be running on port 5000.
 *
 * Safe to re-run: if the teacher account or course already exist, they are
 * reused (existing questions are not duplicate-checked, so re-running will
 * add a second copy of each question under the same course).
 */

const axios = require('axios');
const questions = require('./seedQuestionsData');

const BASE = 'http://localhost:5000/api';

const TEACHER = {
  username: 'testcourse_teacher',
  password: 'teacher123',
  name: 'Test Course Teacher',
  role: 'teacher',
};

const COURSE = {
  name: 'TestCourse',
  description: 'Demo course with sample questions across MIPS, C, C++, Python, Java, JavaScript, C# and Ruby.',
  password: 'teacher123',
};

// Register a user, or log in if the username is already taken.
async function registerOrLogin(user) {
  try {
    const res = await axios.post(`${BASE}/auth/register`, user);
    return res.data.token;
  } catch (err) {
    if (err.response?.status === 409) {
      const res = await axios.post(`${BASE}/auth/login`, { username: user.username, password: user.password });
      return res.data.token;
    }
    throw err;
  }
}

async function run() {
  console.log('Setting up teacher account...');
  const teacherToken = await registerOrLogin(TEACHER);
  const teacherApi = axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${teacherToken}` } });

  console.log('Creating (or finding) TestCourse...');
  let course;
  try {
    const res = await teacherApi.post('/courses', {
      name: COURSE.name,
      description: COURSE.description,
      password: COURSE.password,
    });
    course = res.data;
    console.log(`  ✓ Created course "${course.name}" — code: ${course.code}`);
  } catch (err) {
    const mine = await teacherApi.get('/courses/mine');
    const existing = mine.data.find(c => c.name === COURSE.name);
    if (existing) {
      course = existing;
      console.log(`  ↺ Reusing existing course "${course.name}" — code: ${course.code}`);
    } else {
      throw err;
    }
  }

  console.log(`Seeding ${questions.length} questions into "${course.name}" (${course.code})...`);
  let created = 0;

  for (const q of questions) {
    try {
      const { testCases, answer, isAnswerVisible, ...base } = q;

      // 1. Create question
      const res = await teacherApi.post('/questions', {
        ...base,
        courseId: course.code,
        createdBy: TEACHER.username,
      });
      const id = res.data._id;

      // 2. Set answer
      if (answer) {
        await teacherApi.post(`/questions/${id}/answer`, { answer });
      }

      // 3. Set test cases
      if (testCases && testCases.length > 0) {
        await teacherApi.put(`/questions/${id}`, { testCases });
      }

      // 4. Set visibility
      if (isAnswerVisible) {
        await teacherApi.patch(`/questions/${id}/visibility`, { isAnswerVisible: true });
      }

      console.log(`  ✓ [${q.language.padEnd(10)}] ${q.title}`);
      created++;
    } catch (e) {
      console.error(`  ✗ ${q.title}: ${e.response?.data?.error || e.message}`);
    }
  }

  console.log(`\nDone — ${created}/${questions.length} questions created.`);
  console.log('\n=== TestCourse details ===');
  console.log(`  Course name: ${course.name}`);
  console.log(`  Course code: ${course.code}`);
  console.log(`  Enrollment password: ${COURSE.password}`);
  console.log('\nTo join as a student: go to the Dashboard, click "+ Join a course",');
  console.log(`then enter code "${course.code}", password "${COURSE.password}", and your roll number.`);
}

run().catch(err => {
  console.error('Seeding failed:', err.response?.data?.error || err.message || err);
  if (err.code === 'ECONNREFUSED') {
    console.error('  → Make sure the backend is running: node src/server.js');
  }
  process.exit(1);
});
