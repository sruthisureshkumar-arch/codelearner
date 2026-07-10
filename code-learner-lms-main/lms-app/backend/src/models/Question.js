const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  input: { type: String, default: '' },       // prepended before student code (SQL setup)
  appendSql: { type: String, default: '' },   // appended after student code (SQL only)
  expectedOutput: { type: String, default: '' },
  isHidden: { type: Boolean, default: false },
}, { _id: true });

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    answer: { type: String, default: null },
    placeholderCode: { type: String, default: '' },
    language: { type: String, default: '' },
    testCases: { type: [testCaseSchema], default: [] },
    isAnswerVisible: { type: Boolean, default: false },
    courseId: { type: String, required: true },
    createdBy: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    hideTestCases: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
