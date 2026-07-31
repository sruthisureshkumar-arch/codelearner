/**
 * seed.js — Populate CS101 with demo questions for all 8 languages.
 * Run:  node seed.js
 * Requires the backend to be running on port 5000.
 */

const axios = require('axios');

const BASE   = 'http://localhost:5001/api';
const COURSE = 'course-001';
const TEACHER = 'teacher-001';

const questions = require("./seedQuestionsData");

async function seed() {
  console.log(`Seeding ${questions.length} questions into course "${COURSE}"...`);
  let created = 0;

  for (const q of questions) {
    try {
      const { testCases, answer, isAnswerVisible, ...base } = q;

      // 1. Create question
      const res = await axios.post(`${BASE}/questions`, {
        ...base,
        courseId:  COURSE,
        createdBy: TEACHER,
      });
      const id = res.data._id;

      // 2. Set answer
      if (answer) {
        await axios.post(`${BASE}/questions/${id}/answer`, { answer });
      }

      // 3. Set test cases
      if (testCases && testCases.length > 0) {
        await axios.put(`${BASE}/questions/${id}`, { testCases });
      }

      // 4. Set visibility
      if (isAnswerVisible) {
        await axios.patch(`${BASE}/questions/${id}/visibility`, { isAnswerVisible: true });
      }

      console.log(`  ✓ [${q.language.padEnd(10)}] ${q.title}`);
      created++;
    } catch (e) {
      console.error(`  ✗ ${q.title}: ${e.response?.data?.error || e.message}`);
    }
  }

  console.log(`\nDone — ${created}/${questions.length} questions created.`);
}

seed();
