const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  name:                  { type: String, required: true, trim: true },
  description:           { type: String, default: '', trim: true },
  courseId:              { type: String, required: true },
  createdBy:             { type: String, required: true },
  isTimed:               { type: Boolean, default: false },
  durationMinutes:       { type: Number, default: 30 },
  isActive:              { type: Boolean, default: false },
  questions:             [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
