const mongoose = require('mongoose');

const gradeEntrySchema = new mongoose.Schema({
  questionId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  questionTitle:   { type: String, default: '' },
  bestScore:       { type: Number, default: 0 },
  attempts:        { type: Number, default: 0 },
  lastSubmittedAt: { type: Date },
}, { _id: false });

const gradeSchema = new mongoose.Schema({
  studentId:  { type: String, required: true },
  rollNumber: { type: String, default: '' },
  courseId:   { type: String, required: true },
  grades:     { type: [gradeEntrySchema], default: [] },
  totalScore: { type: Number, default: 0 },
  updatedAt:  { type: Date, default: Date.now },
});

gradeSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
