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

// CORS — allow the frontend origin (set FRONTEND_URL in .env)
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, same-server nginx)
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(bodyParser.json({ limit: '200kb' }));           // cap request size
app.use(bodyParser.urlencoded({ extended: true, limit: '200kb' }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 20,   // support PM2 cluster mode (5 per process × 4 cores)
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
