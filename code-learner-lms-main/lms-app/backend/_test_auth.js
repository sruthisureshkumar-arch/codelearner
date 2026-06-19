process.env.JWT_SECRET = 'test_secret';

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticate, requireRole } = require('./src/middleware/auth');

(async () => {
  const plain = 'mypassword123';
  const hash = await bcrypt.hash(plain, 10);
  console.log('Hash != plaintext:', hash !== plain);
  console.log('Compare correct password:', await bcrypt.compare(plain, hash));
  console.log('Compare wrong password:', await bcrypt.compare('wrongpass', hash));
})();

const app = express();
app.get('/protected', authenticate, (req, res) => res.json({ ok: true, user: req.user }));
app.get('/teacher-only', authenticate, requireRole('teacher'), (req, res) => res.json({ ok: true }));
app.get('/student-only', authenticate, requireRole('student'), (req, res) => res.json({ ok: true }));

const server = app.listen(5099, async () => {
  const axios = require('axios');
  const base = 'http://localhost:5099';

  const studentToken = jwt.sign({ id: '1', username: 'alice', name: 'Alice', role: 'student', courseId: 'course-001' }, 'test_secret', { expiresIn: '7d' });
  const teacherToken = jwt.sign({ id: '2', username: 'bob', name: 'Bob', role: 'teacher', courseId: 'course-001' }, 'test_secret', { expiresIn: '7d' });

  const tests = [];
  tests.push(['no token -> 401', axios.get(`${base}/protected`).then(() => 'NOT REJECTED').catch(e => e.response.status)]);
  tests.push(['invalid token -> 401', axios.get(`${base}/protected`, { headers: { Authorization: 'Bearer garbage' } }).then(() => 'NOT REJECTED').catch(e => e.response.status)]);
  tests.push(['valid token -> 200 + user', axios.get(`${base}/protected`, { headers: { Authorization: `Bearer ${studentToken}` } }).then(r => JSON.stringify(r.data))]);
  tests.push(['student on teacher-only -> 403', axios.get(`${base}/teacher-only`, { headers: { Authorization: `Bearer ${studentToken}` } }).then(() => 'NOT REJECTED').catch(e => e.response.status)]);
  tests.push(['teacher on teacher-only -> 200', axios.get(`${base}/teacher-only`, { headers: { Authorization: `Bearer ${teacherToken}` } }).then(r => JSON.stringify(r.data))]);
  tests.push(['teacher on student-only -> 403', axios.get(`${base}/student-only`, { headers: { Authorization: `Bearer ${teacherToken}` } }).then(() => 'NOT REJECTED').catch(e => e.response.status)]);

  for (const [label, p] of tests) {
    console.log(label, '=>', await p);
  }
  server.close();
});
