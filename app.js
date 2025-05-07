const express = require('express');
require('dotenv').config();
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const path = require('path');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin:['https://neplearns.com','https://www.neplearns.com'],
  // origin:true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/materials', express.static(path.join(__dirname, 'uploads', 'materials')));
app.use('/uploads/courses', express.static(path.join(__dirname, 'uploads', 'courses')));
// Add these static file routes
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));
app.use('/uploads/files', express.static(path.join(__dirname, 'uploads/files')));
// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/teacherRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/upload', require('./routes/uploadRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/', require('./routes/courseRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));

app.get('/', (req, res) => res.send('API Running'));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));