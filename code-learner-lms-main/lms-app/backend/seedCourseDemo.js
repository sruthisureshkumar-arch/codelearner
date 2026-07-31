/**
 * seedCourseDemo.js — Create a sample course (as a demo teacher) and enroll a
 * demo student into it, so you can immediately try out the course-management
 * flow on the student side.
 *
 * Run:  node seedCourseDemo.js
 * Requires the backend to be running on port 5000.
 *
 * Safe to re-run: if the demo accounts already exist it logs in instead of
 * registering, and if the demo course already exists it reuses it.
 */

const axios = require('axios');

const BASE = 'http://localhost:5001/api';

const TEACHER = {
  username: 'teacher_demo',
  password: 'teacher123',
  name: 'Demo Teacher',
  role: 'teacher',
};

const STUDENT = {
  username: 'student_demo',
  password: 'student123',
  name: 'Demo Student',
  role: 'student',
  rollNumber: '21CS001',
};

const COURSE = {
  name: 'CS101 – Intro to Programming',
  description: 'Demo course for trying out questions, grades and the course dashboard.',
  password: 'join1234', // students need this + their roll number to enroll
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
  console.log('Setting up demo teacher account...');
  const teacherToken = await registerOrLogin(TEACHER);
  const teacherApi = axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${teacherToken}` } });

  console.log('Creating (or finding) demo course...');
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
    // If we've already run this script before, reuse the first course this teacher owns.
    const mine = await teacherApi.get('/courses/mine');
    if (mine.data.length > 0) {
      course = mine.data[0];
      console.log(`  ↺ Reusing existing course "${course.name}" — code: ${course.code}`);
    } else {
      throw err;
    }
  }

  console.log('Setting up demo student account...');
  const studentToken = await registerOrLogin(STUDENT);
  const studentApi = axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${studentToken}` } });

  console.log('Enrolling demo student in the course...');
  try {
    await studentApi.post('/courses/enroll', {
      code: course.code,
      password: COURSE.password,
      rollNumber: STUDENT.rollNumber,
    });
    console.log('  ✓ Enrolled.');
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('  ↺ Already enrolled.');
    } else {
      throw err;
    }
  }

  console.log('\nDone! Log in with these accounts:\n');
  console.log('  Teacher login');
  console.log(`    username: ${TEACHER.username}`);
  console.log(`    password: ${TEACHER.password}`);
  console.log('\n  Student login');
  console.log(`    username: ${STUDENT.username}`);
  console.log(`    password: ${STUDENT.password}`);
  console.log(`    roll number: ${STUDENT.rollNumber}`);
  console.log('\n  Course');
  console.log(`    code:     ${course.code}`);
  console.log(`    password: ${COURSE.password}`);
  console.log('\nTip: run "node seed.js" too if you also want sample questions in course-001.');
}

run().catch(err => {
  console.error('Seeding failed:');
  if (err.response) {
    console.error('  Status:', err.response.status);
    console.error('  Body:  ', JSON.stringify(err.response.data));
  } else {
    console.error('  Error: ', err.message || err);
  }
  process.exit(1);
});
