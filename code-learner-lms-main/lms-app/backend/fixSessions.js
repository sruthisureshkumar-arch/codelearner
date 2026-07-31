require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  const Session = require('./src/models/Session');
  const Course  = mongoose.model('Course', new mongoose.Schema({}, { strict: false }));

  const sessions = await Session.find({});
  const courses  = await Course.find({});

  console.log('\n=== ALL COURSES ===');
  courses.forEach(c => console.log(`  code="${c.code}"  name="${c.name}"  _id=${c._id}`));

  console.log('\n=== ALL SESSIONS ===');
  sessions.forEach(s => console.log(`  name="${s.name}"  courseId="${s.courseId}"  isActive=${s.isActive}  _id=${s._id}`));

  // Set ALL sessions to isActive=true so students can see them
  if (sessions.length > 0) {
    await Session.updateMany({}, { isActive: true });
    console.log(`\n✓ Set ${sessions.length} session(s) to isActive=true`);
  }

  await mongoose.disconnect();
}

fix().catch(e => { console.error(e); process.exit(1); });
