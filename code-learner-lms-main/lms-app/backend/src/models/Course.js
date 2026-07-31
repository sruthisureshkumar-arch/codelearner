const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const courseSchema = new mongoose.Schema({
  name:               { type: String, required: true, trim: true },
  description:        { type: String, default: '', trim: true },
  code:               { type: String, required: true, unique: true, uppercase: true, trim: true },
  passwordHash:       { type: String, required: true },
  enrollmentPassword: { type: String, default: '' }, // plaintext kept for teacher display
  createdBy:          { type: String, required: true },
}, { timestamps: true });

// Hash the enrollment password before saving, only if it changed
courseSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare a plaintext enrollment password against the stored hash
courseSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Never leak the password hash in API responses
courseSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Course', courseSchema);
