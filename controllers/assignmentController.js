const Assignment = require('../models/Assignment');
const Lesson = require('../models/Lesson');

// Create Assignment
const createAssignment = async (req, res) => {
  try {
    const { title, description, lessonId, dueDate, instructions } = req.body;
    const userId = req.user.id;

    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson || !lesson.course) {
      return res.status(404).json({ message: 'Lesson or course not found' });
    }

    // Check if user is the course teacher
    if (lesson.course.teacher.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to create assignment for this lesson' });
    }

    // Check if lesson already has an assignment
    if (lesson.assignment) {
      return res.status(400).json({ message: 'Lesson already has an assignment' });
    }

    const assignment = new Assignment({
      title,
      description,
      instructions,
      lesson: lessonId,
      dueDate,
      createdBy: userId,
    });

    // Handle uploaded attachment
    if (req.file) {
      assignment.attachments.push({
        path: req.file.path,
        originalName: req.file.originalname
      });
    }

    await assignment.save();

    // Update lesson with the new assignment
    lesson.assignment = assignment._id;
    await lesson.save();

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Submit Assignment
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, file } = req.body;
    const studentId = req.user.id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (new Date() > assignment.dueDate) {
      return res.status(400).json({ message: 'Submission deadline has passed' });
    }

    assignment.submissions.push({
      student: studentId,
      file,
      submissionDate: new Date(),
    });

    await assignment.save();
    res.json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const getAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('lesson', 'title')
      .populate('createdBy', 'username');

    if (!assignment) throw createError.NotFound('Assignment not found');
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};
const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!assignment) throw createError.Forbidden('Not authorized to update this assignment');
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });
    if (!assignment) throw createError.Forbidden('Not authorized to delete this assignment');
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};
const getSubmissions = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('submissions.student', 'username email');
    if (!assignment) throw createError.NotFound('Assignment not found');
    
    res.json({ success: true, data: assignment.submissions });
  } catch (error) {
    next(error);
  }
};

const gradeSubmission = async (req, res, next) => {
  try {
    const { grade } = req.body;
    const { submissionId } = req.params;

    const assignment = await Assignment.findOne({ "submissions._id": submissionId });
    if (!assignment) throw createError.NotFound('Submission not found');

    const submission = assignment.submissions.id(submissionId);
    submission.grade = grade;

    await assignment.save();
    res.json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
};
const getAssignmentsByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const assignments = await Assignment.find({ lesson: lessonId }).populate('lesson', 'title');
    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Then export them
module.exports = {
  createAssignment,
  submitAssignment,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  getSubmissions,         
  gradeSubmission,
  getAssignmentsByLesson      
};

