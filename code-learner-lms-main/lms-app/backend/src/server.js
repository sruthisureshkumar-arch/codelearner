require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const questionRoutes    = require('./routes/questionRoutes');
const submissionRoutes  = require('./routes/submissionRoutes');
const gradeRoutes       = require('./routes/gradeRoutes');
const plagiarismRoutes  = require('./routes/plagiarismRoutes');
const authRoutes        = require('./routes/authRoutes');
const courseRoutes      = require('./routes/courseRoutes');
const sessionRoutes     = require('./routes/sessionRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Routes
app.use('/api/auth',        authRoutes);
app.use('/api/questions',   questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/grades',      gradeRoutes);
app.use('/api/plagiarism',  plagiarismRoutes);
app.use('/api/courses',     courseRoutes);
app.use('/api/sessions',    sessionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
