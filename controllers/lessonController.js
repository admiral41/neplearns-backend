const Lesson = require('../models/Lesson');
const Course = require('../models/Courses');

// Create Lesson
exports.createLesson = async (req, res) => {
  try {
    const { title, description, content, courseId } = req.body;
    console.log({ title, description, content, courseId });
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const lesson = new Lesson({ title, description, content, course: courseId });
    await lesson.save();

    if (!course.lessons) course.lessons = [];
    course.lessons.push(lesson._id);
    await course.save();

    res.status(201).json(lesson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Lessons by Course
exports.getLessonsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const lessons = await Lesson.find({ course: courseId }).populate('course');
    res.json(lessons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Lesson
exports.updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, description, content } = req.body;

    const lesson = await Lesson.findByIdAndUpdate(
      lessonId,
      { title, description, content },
      { new: true }
    );

    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    res.json(lesson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Lesson
exports.deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findByIdAndDelete(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    await Course.updateOne(
      { _id: lesson.course },
      { $pull: { lessons: lessonId } }
    );

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};