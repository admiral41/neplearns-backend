const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');

// Create Quiz
exports.createQuiz = async (req, res) => {
  try {
    const { title, lessonId, questions, timeLimit } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const quiz = new Quiz({
      title,
      lesson: lessonId,
      questions,
      timeLimit,
      createdBy: req.user.id,
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get All Quizzes for a Lesson
exports.getQuizzesByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const quizzes = await Quiz.find({ lesson: lessonId }).populate('lesson');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Attempt Quiz
exports.attemptQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let score = 0;
    quiz.questions.forEach((question, index) => {
      if (question.correctAnswer === answers[index]) score++;
    });

    res.json({ score, totalQuestions: quiz.questions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('lesson', 'title')
      .populate('createdBy', 'username');

    if (!quiz) throw createError.NotFound('Quiz not found');
    res.json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
};

exports.updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!quiz) throw createError.Forbidden('Not authorized to update this quiz');
    res.json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
};

exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });
    if (!quiz) throw createError.Forbidden('Not authorized to delete this quiz');
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};