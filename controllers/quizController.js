const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizScore = require('../models/QuizScore');
const QuizLog = require('../models/QuizLog');
const Course = require('../models/course.model');
const Week = require('../models/weeks'); 
const Lesson = require('../models/lessons');
const User = require('../models/user.model');
const Lecturer = require('../models/lecturer.model');
const mongoose = require('mongoose');

// ==========================
// BASIC QUIZ CRUD
// ==========================

// Get all quizzes (admin view)
exports.getAllQuizzes = async (req, res) => {
    try {
        const { 
            courseId, 
            weekId, 
            lessonId, 
            status, 
            search, 
            page = 1, 
            limit = 20 
        } = req.query;

        // Build query
        let query = {};

        if (courseId) query.course = courseId;
        if (weekId) query.week = weekId;
        if (lessonId) query.lesson = lessonId;
        
        // Status filter
        if (status === 'published') query.isPublished = true;
        if (status === 'draft') query.isPublished = false;
        if (status === 'active') {
            query.isPublished = true;
            const now = new Date();
            query.$or = [
                { startDate: { $exists: false } },
                { startDate: { $lte: now } }
            ];
            query.$or.push(
                { endDate: { $exists: false } },
                { endDate: { $gte: now } }
            );
        }

        // Search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get quizzes
        const quizzes = await Quiz.find(query)
            .populate('course', 'courseTitle courseCode')
            .populate('week', 'weekNumber title')
            .populate('lesson', 'lessonTitle')
            .populate('postedBy', 'firstname lastname email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await Quiz.countDocuments(query);

        // Get statistics
        const stats = await Quiz.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalQuizzes: { $sum: 1 },
                    publishedQuizzes: { $sum: { $cond: ['$isPublished', 1, 0] } },
                    totalPoints: { $sum: '$totalPoints' },
                    averageDuration: { $avg: '$duration' }
                }
            }
        ]);

        res.json({
            success: true,
            data: quizzes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            stats: stats[0] || {
                totalQuizzes: 0,
                publishedQuizzes: 0,
                totalPoints: 0,
                averageDuration: 0
            }
        });
    } catch (error) {
        console.error('Get all quizzes error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get quizzes',
            error: error.message
        });
    }
};

// Create a new quiz
exports.createQuiz = async (req, res) => {
    try {
        const { 
            course, 
            week, 
            lesson, 
            title, 
            description, 
            duration = 30,
            maxAttempts = 1,
            passingScore = 50,
            isPublished = false,
            isTimed = false,
            showResults = true,
            shuffleQuestions = false,
            shuffleOptions = false,
            startDate,
            endDate,
            instructions
        } = req.body;
        
        // Validate required fields
        if (!course) {
            return res.status(400).json({
                success: false,
                msg: 'Course is required'
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                msg: 'Quiz title is required'
            });
        }

        // Check if course exists
        const courseData = await Course.findById(course);
        if (!courseData) {
            return res.status(404).json({
                success: false,
                msg: 'Course not found'
            });
        }

        // Check permissions
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                // Check if lecturer is assigned to this course
                const isAssigned = courseData.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                // Check if lecturer created the course
                const isCreator = courseData.createdBy?.toString() === req.user._id.toString();
                
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to create quiz for this course'
            });
        }

        // Validate week if provided
        if (week) {
            const weekData = await Week.findOne({ _id: week, course });
            if (!weekData) {
                return res.status(400).json({
                    success: false,
                    msg: 'Invalid week for this course'
                });
            }
        }

        // Validate lesson if provided
        if (lesson) {
            const lessonData = await Lesson.findOne({ _id: lesson, course });
            if (!lessonData) {
                return res.status(400).json({
                    success: false,
                    msg: 'Invalid lesson for this course'
                });
            }
            // If lesson has a week, ensure consistency
            if (lessonData.week && week && lessonData.week.toString() !== week) {
                return res.status(400).json({
                    success: false,
                    msg: 'Lesson does not belong to the specified week'
                });
            }
        }

        const quiz = new Quiz({
            course,
            week: week || null,
            lesson: lesson || null,
            title: title.trim(),
            description: description?.trim() || '',
            instructions: instructions?.trim() || '',
            duration: parseInt(duration),
            maxAttempts: parseInt(maxAttempts),
            passingScore: parseInt(passingScore),
            isPublished,
            isTimed,
            showResults,
            shuffleQuestions,
            shuffleOptions,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            postedBy: req.user._id,
            totalPoints: 0
        });

        await quiz.save();

        res.status(201).json({
            success: true,
            msg: 'Quiz created successfully',
            data: quiz
        });
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to create quiz',
            error: error.message
        });
    }
};

// Get quizzes by course
exports.getQuizzesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { includeDrafts = 'false' } = req.query;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                msg: 'Course not found'
            });
        }

        // Check if user has access
        const isEnrolled = course.learners?.some(learnerId => 
            learnerId.toString() === req.user?._id?.toString()
        );
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer && course.lecturers?.some(lecturerId => 
                lecturerId.toString() === lecturer._id.toString()
            )) {
                isLecturer = true;
            }
        }
        
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        const isCreator = course.createdBy?.toString() === req.user?._id?.toString();

        if (!isAdmin && !isLecturer && !isCreator && !isEnrolled) {
            return res.status(403).json({
                success: false,
                msg: 'Not authorized to access quizzes for this course'
            });
        }

        // Build query
        let query = { course: courseId };
        
        // Only show published quizzes to students
        if (!isAdmin && !isLecturer && !isCreator && includeDrafts === 'false') {
            query.isPublished = true;
        }

        const quizzes = await Quiz.find(query)
            .populate('week', 'weekNumber title')
            .populate('lesson', 'lessonTitle')
            .populate('postedBy', 'firstname lastname')
            .sort({ createdAt: -1 });

        // Add attempt info for students
        if (!isAdmin && !isLecturer && !isCreator) {
            for (const quiz of quizzes) {
                const attempts = await QuizScore.find({
                    user: req.user._id,
                    quiz: quiz._id
                }).sort({ createdAt: -1 });
                
                quiz._doc.attempts = attempts;
                quiz._doc.lastAttempt = attempts[0];
                quiz._doc.attemptCount = attempts.length;
                quiz._doc.canRetake = attempts.length < quiz.maxAttempts;
            }
        }

        res.json({
            success: true,
            data: quizzes,
            course: {
                _id: course._id,
                title: course.courseTitle,
                code: course.courseCode
            }
        });
    } catch (error) {
        console.error('Get quizzes by course error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get quizzes',
            error: error.message
        });
    }
};

// Get quizzes by week
exports.getQuizzesByWeek = async (req, res) => {
    try {
        const { weekId } = req.params;

        const week = await Week.findById(weekId).populate('course');
        if (!week) {
            return res.status(404).json({
                success: false,
                msg: 'Week not found'
            });
        }

        const course = week.course;
        
        // Check if user has access
        const isEnrolled = course.learners?.some(learnerId => 
            learnerId.toString() === req.user?._id?.toString()
        );
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer && course.lecturers?.some(lecturerId => 
                lecturerId.toString() === lecturer._id.toString()
            )) {
                isLecturer = true;
            }
        }
        
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        const isCreator = course.createdBy?.toString() === req.user?._id?.toString();

        if (!isAdmin && !isLecturer && !isCreator && !isEnrolled) {
            return res.status(403).json({
                success: false,
                msg: 'Not authorized to access quizzes for this week'
            });
        }

        let query = { week: weekId };
        
        if (!isAdmin && !isLecturer && !isCreator) {
            query.isPublished = true;
        }

        const quizzes = await Quiz.find(query)
            .populate('lesson', 'lessonTitle')
            .populate('postedBy', 'firstname lastname')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            data: quizzes,
            week: {
                _id: week._id,
                weekNumber: week.weekNumber,
                title: week.title,
                course: {
                    _id: course._id,
                    title: course.courseTitle
                }
            }
        });
    } catch (error) {
        console.error('Get quizzes by week error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get quizzes',
            error: error.message
        });
    }
};

// Get quizzes by lesson
exports.getQuizzesByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lesson = await Lesson.findById(lessonId)
            .populate('course')
            .populate('week');
        if (!lesson) {
            return res.status(404).json({
                success: false,
                msg: 'Lesson not found'
            });
        }

        const course = lesson.course;
        
        // Check if user has access
        const isEnrolled = course.learners?.some(learnerId => 
            learnerId.toString() === req.user?._id?.toString()
        );
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer && course.lecturers?.some(lecturerId => 
                lecturerId.toString() === lecturer._id.toString()
            )) {
                isLecturer = true;
            }
        }
        
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        const isCreator = course.createdBy?.toString() === req.user?._id?.toString();

        if (!isAdmin && !isLecturer && !isCreator && !isEnrolled) {
            return res.status(403).json({
                success: false,
                msg: 'Not authorized to access quizzes for this lesson'
            });
        }

        let query = { lesson: lessonId };
        
        if (!isAdmin && !isLecturer && !isCreator) {
            query.isPublished = true;
        }

        const quizzes = await Quiz.find(query)
            .populate('postedBy', 'firstname lastname')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            data: quizzes,
            lesson: {
                _id: lesson._id,
                lessonTitle: lesson.lessonTitle,
                course: {
                    _id: course._id,
                    title: course.courseTitle
                },
                week: lesson.week ? {
                    _id: lesson.week._id,
                    weekNumber: lesson.week.weekNumber,
                    title: lesson.week.title
                } : null
            }
        });
    } catch (error) {
        console.error('Get quizzes by lesson error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get quizzes',
            error: error.message
        });
    }
};

// Get single quiz by ID
exports.getQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { withAnswers = 'false', includeQuestions = 'false' } = req.query;

        const quiz = await Quiz.findById(id)
            .populate('course', 'courseTitle courseCode')
            .populate('week', 'weekNumber title')
            .populate('lesson', 'lessonTitle')
            .populate('postedBy', 'firstname lastname email');

        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check if user has access
        const course = await Course.findById(quiz.course);
        
        // Check if user is enrolled as a learner
        const isEnrolled = course.learners?.some(learnerId => 
            learnerId.toString() === req.user?._id?.toString()
        );
        
        // Check if user is a lecturer for this course
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer && course.lecturers?.some(lecturerId => 
                lecturerId.toString() === lecturer._id.toString()
            )) {
                isLecturer = true;
            }
        }
        
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        const isCreator = quiz.postedBy?._id?.toString() === req.user?._id?.toString();

        if (!isAdmin && !isLecturer && !isCreator && !isEnrolled) {
            return res.status(403).json({
                success: false,
                msg: 'Not authorized to access this quiz'
            });
        }

        // Prepare quiz data
        const quizData = quiz.toJSON();
        
        // Get questions if requested
        if (includeQuestions === 'true') {
            const questions = await QuizQuestion.find({ quiz: id }).sort({ order: 1 });
            
            // For students, don't show answers unless quiz is completed
            if ((isAdmin || isLecturer || isCreator) || withAnswers === 'true') {
                quizData.questions = questions.map(q => q.toObject());
            } else {
                quizData.questions = questions.map(q => {
                    const questionObj = q.toObject();
                    // Don't expose correct answers for students
                    if (questionObj.questionType !== 'essay' && questionObj.questionType !== 'short_answer') {
                        delete questionObj.correctAnswers;
                        if (questionObj.options) {
                            questionObj.options = questionObj.options.map(opt => ({
                                text: opt.text,
                                _id: opt._id
                            }));
                        }
                    }
                    return questionObj;
                });
            }
        }

        res.json({
            success: true,
            data: quizData
        });
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get quiz',
            error: error.message
        });
    }
};

// Get single question
exports.getQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;

        const question = await QuizQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({
                success: false,
                msg: 'Question not found'
            });
        }

        // Check permissions
        const quiz = await Quiz.findById(question.quiz);
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer && course.lecturers?.some(lecturerId => 
                lecturerId.toString() === lecturer._id.toString()
            )) {
                isLecturer = true;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to view this question'
            });
        }

        res.json({
            success: true,
            data: question
        });
    } catch (error) {
        console.error('Get question error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get question',
            error: error.message
        });
    }
};

// Update quiz
exports.updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to update this quiz'
            });
        }

        // Don't allow updating certain fields
        const restrictedFields = ['postedBy', 'course', 'totalPoints', 'questions'];
        restrictedFields.forEach(field => delete updateData[field]);

        // Validate week and lesson if provided
        if (updateData.week !== undefined) {
            if (updateData.week) {
                const weekData = await Week.findOne({ _id: updateData.week, course: quiz.course });
                if (!weekData) {
                    return res.status(400).json({
                        success: false,
                        msg: 'Invalid week for this course'
                    });
                }
            }
        }

        if (updateData.lesson !== undefined) {
            if (updateData.lesson) {
                const lessonData = await Lesson.findOne({ 
                    _id: updateData.lesson, 
                    course: quiz.course 
                });
                if (!lessonData) {
                    return res.status(400).json({
                        success: false,
                        msg: 'Invalid lesson for this course'
                    });
                }
            }
        }

        Object.assign(quiz, updateData);
        await quiz.save();

        res.json({
            success: true,
            msg: 'Quiz updated successfully',
            data: quiz
        });
    } catch (error) {
        console.error('Update quiz error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to update quiz',
            error: error.message
        });
    }
};

// Delete quiz
exports.deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to delete this quiz'
            });
        }

        // Delete associated questions
        await QuizQuestion.deleteMany({ quiz: id });
        
        // Delete associated scores and logs
        const scores = await QuizScore.find({ quiz: id });
        for (const score of scores) {
            await QuizLog.deleteMany({ _id: { $in: score.logs } });
        }
        await QuizScore.deleteMany({ quiz: id });

        // Delete quiz
        await quiz.deleteOne();

        res.json({
            success: true,
            msg: 'Quiz deleted successfully'
        });
    } catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to delete quiz',
            error: error.message
        });
    }
};

// Duplicate quiz
exports.duplicateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { newTitle } = req.body;

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to duplicate this quiz'
            });
        }

        // Get questions
        const questions = await QuizQuestion.find({ quiz: id });

        // Create new quiz
        const newQuiz = new Quiz({
            ...quiz.toObject(),
            _id: undefined,
            title: newTitle || `${quiz.title} (Copy)`,
            isPublished: false,
            postedBy: req.user._id,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newQuiz.save();

        // Duplicate questions
        const questionPromises = questions.map(async (question) => {
            const newQuestion = new QuizQuestion({
                ...question.toObject(),
                _id: undefined,
                quiz: newQuiz._id,
                addedBy: req.user._id,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await newQuestion.save();
            return newQuestion._id;
        });

        const newQuestionIds = await Promise.all(questionPromises);
        
        // Update quiz with new questions
        newQuiz.questions = newQuestionIds;
        newQuiz.totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
        await newQuiz.save();

        res.status(201).json({
            success: true,
            msg: 'Quiz duplicated successfully',
            data: newQuiz
        });
    } catch (error) {
        console.error('Duplicate quiz error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to duplicate quiz',
            error: error.message
        });
    }
};

// Toggle publish status
exports.togglePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublished } = req.body;

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to publish/unpublish this quiz'
            });
        }

        quiz.isPublished = isPublished;
        await quiz.save();

        res.json({
            success: true,
            msg: isPublished ? 'Quiz published successfully' : 'Quiz unpublished successfully',
            data: quiz
        });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to update quiz status',
            error: error.message
        });
    }
};

// Get quiz statistics
exports.getQuizStats = async (req, res) => {
    try {
        const { id } = req.params;

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to view quiz statistics'
            });
        }

        // Get question stats
        const questions = await QuizQuestion.find({ quiz: id });
        const questionStats = {
            total: questions.length,
            byType: {},
            byDifficulty: {},
            totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0)
        };

        questions.forEach(q => {
            // Count by type
            questionStats.byType[q.questionType] = (questionStats.byType[q.questionType] || 0) + 1;
            
            // Count by difficulty
            questionStats.byDifficulty[q.difficulty] = (questionStats.byDifficulty[q.difficulty] || 0) + 1;
        });

        // Get attempt stats
        const attempts = await QuizScore.find({ quiz: id });
        const attemptStats = {
            total: attempts.length,
            completed: attempts.filter(a => a.status === 'completed').length,
            inProgress: attempts.filter(a => a.status === 'in_progress').length,
            passed: attempts.filter(a => a.percentage >= quiz.passingScore).length,
            failed: attempts.filter(a => a.percentage < quiz.passingScore && a.status === 'completed').length,
            averageScore: attempts.length > 0 
                ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length 
                : 0,
            averageTime: attempts.length > 0 
                ? attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / attempts.length 
                : 0
        };

        // Get unique students
        const uniqueStudents = [...new Set(attempts.map(a => a.user.toString()))].length;

        res.json({
            success: true,
            data: {
                quiz,
                questionStats,
                attemptStats,
                uniqueStudents,
                completionRate: attempts.length > 0 
                    ? (attemptStats.completed / attempts.length) * 100 
                    : 0,
                passRate: attempts.length > 0 
                    ? (attemptStats.passed / attempts.length) * 100 
                    : 0
            }
        });
    } catch (error) {
        console.error('Get quiz stats error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get quiz statistics',
            error: error.message
        });
    }
};

// Validate quiz
exports.validateQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to validate this quiz'
            });
        }

        // Get questions
        const questions = await QuizQuestion.find({ quiz: id });
        const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

        // Validation checks
        const validations = {
            hasTitle: quiz.title && quiz.title.trim().length > 0,
            hasCourse: !!quiz.course,
            hasQuestions: questions.length > 0,
            hasTotalPoints: totalPoints > 0,
            hasDuration: quiz.duration > 0,
            hasPassingScore: quiz.passingScore >= 0 && quiz.passingScore <= 100,
            hasMaxAttempts: quiz.maxAttempts > 0,
            validDates: !quiz.startDate || !quiz.endDate || quiz.startDate < quiz.endDate,
            allQuestionsValid: questions.every(q => {
                if (!q.questionText || q.questionText.trim().length === 0) return false;
                if (q.questionType === 'multiple_choice' || q.questionType === 'single_choice') {
                    return q.options && q.options.length >= 2 && q.correctAnswers && q.correctAnswers.length > 0;
                }
                if (q.questionType === 'true_false') {
                    return q.options && q.options.length === 2;
                }
                return true;
            })
        };

        const isValid = Object.values(validations).every(v => v === true);
        const issues = Object.entries(validations)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        // Update total points
        if (quiz.totalPoints !== totalPoints) {
            quiz.totalPoints = totalPoints;
            await quiz.save();
        }

        res.json({
            success: true,
            data: {
                isValid,
                issues,
                totalQuestions: questions.length,
                totalPoints,
                canPublish: isValid && questions.length > 0
            }
        });
    } catch (error) {
        console.error('Validate quiz error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to validate quiz',
            error: error.message
        });
    }
};

// ==========================
// QUESTION MANAGEMENT
// ==========================

// Add question to quiz
exports.addQuestion = async (req, res) => {
    try {
        const { quizId } = req.params;
        const {
            questionText,
            questionType,
            options,
            correctAnswers,
            explanation,
            difficulty = 'medium',
            points = 1,
            isActive = true,
            tags = []
        } = req.body;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to add questions to this quiz'
            });
        }

        // Validate question data
        if (!questionText || !questionText.trim()) {
            return res.status(400).json({
                success: false,
                msg: 'Question text is required'
            });
        }

        if (!questionType) {
            return res.status(400).json({
                success: false,
                msg: 'Question type is required'
            });
        }

        // Validate based on question type
        if (questionType === 'multiple_choice' || questionType === 'single_choice') {
            if (!options || options.length < 2) {
                return res.status(400).json({
                    success: false,
                    msg: 'At least 2 options are required for choice questions'
                });
            }
            if (!correctAnswers || correctAnswers.length === 0) {
                return res.status(400).json({
                    success: false,
                    msg: 'Correct answer(s) are required'
                });
            }
        }

        if (questionType === 'true_false') {
            if (!correctAnswers || correctAnswers.length === 0) {
                return res.status(400).json({
                    success: false,
                    msg: 'Correct answer is required for true/false questions'
                });
            }
        }

        // Get the next order number
        const lastQuestion = await QuizQuestion.findOne({ quiz: quizId })
            .sort({ order: -1 });
        const order = lastQuestion ? lastQuestion.order + 1 : 0;

        // Create question
        const question = new QuizQuestion({
            quiz: quizId,
            questionText: questionText.trim(),
            questionType,
            options,
            correctAnswers,
            explanation: explanation?.trim() || '',
            difficulty,
            points: parseInt(points),
            isActive,
            tags,
            order,
            addedBy: req.user._id,
            maxPoints: parseInt(points)
        });

        await question.save();

        // Update quiz's questions array and total points
        quiz.questions.push(question._id);
        quiz.totalPoints += parseInt(points);
        await quiz.save();

        res.status(201).json({
            success: true,
            msg: 'Question added successfully',
            data: question
        });
    } catch (error) {
        console.error('Add question error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to add question',
            error: error.message
        });
    }
};

// Get quiz questions
exports.getQuizQuestions = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { 
            withAnswers = 'false', 
            difficulty, 
            type,
            activeOnly = 'true'
        } = req.query;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        // Students can only view questions without answers
        const canViewAnswers = isAdmin || isLecturer;

        // Build query
        let query = { quiz: quizId };
        
        if (difficulty) query.difficulty = difficulty;
        if (type) query.questionType = type;
        if (activeOnly === 'true' && !isAdmin && !isLecturer) {
            query.isActive = true;
        }

        const questions = await QuizQuestion.find(query)
            .populate('addedBy', 'firstname lastname')
            .sort({ order: 1 });

        // Prepare response
        const questionsData = questions.map(q => {
            const questionObj = q.toObject();
            
            // Hide answers if not authorized
            if (!canViewAnswers && withAnswers !== 'true') {
                delete questionObj.correctAnswers;
                if (questionObj.questionType !== 'essay' && questionObj.questionType !== 'short_answer') {
                    if (questionObj.options) {
                        questionObj.options = questionObj.options.map(opt => ({
                            text: opt.text,
                            _id: opt._id
                        }));
                    }
                }
            }
            
            return questionObj;
        });

        // Get statistics
        const stats = {
            total: questions.length,
            byType: {},
            byDifficulty: {},
            totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0)
        };

        questions.forEach(q => {
            stats.byType[q.questionType] = (stats.byType[q.questionType] || 0) + 1;
            stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
        });

        res.json({
            success: true,
            data: questionsData,
            stats,
            canViewAnswers
        });
    } catch (error) {
        console.error('Get quiz questions error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get quiz questions',
            error: error.message
        });
    }
};

// Update question
exports.updateQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const updateData = req.body;

        const question = await QuizQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({
                success: false,
                msg: 'Question not found'
            });
        }

        // Check permissions
        const quiz = await Quiz.findById(question.quiz);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to update this question'
            });
        }

        // Don't allow updating certain fields
        const restrictedFields = ['quiz', 'addedBy', 'order'];
        restrictedFields.forEach(field => delete updateData[field]);

        // Calculate points difference
        const oldPoints = question.points || 1;
        const newPoints = updateData.points ? parseInt(updateData.points) : oldPoints;
        const pointsDifference = newPoints - oldPoints;

        // Update question
        Object.assign(question, updateData);
        await question.save();

        // Update quiz total points
        if (pointsDifference !== 0) {
            quiz.totalPoints += pointsDifference;
            await quiz.save();
        }

        res.json({
            success: true,
            msg: 'Question updated successfully',
            data: question
        });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to update question',
            error: error.message
        });
    }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;

        const question = await QuizQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({
                success: false,
                msg: 'Question not found'
            });
        }

        // Check permissions
        const quiz = await Quiz.findById(question.quiz);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to delete this question'
            });
        }

        // Remove question from quiz
        quiz.questions = quiz.questions.filter(q => q.toString() !== questionId);
        quiz.totalPoints -= question.points || 1;
        await quiz.save();

        // Delete question
        await question.deleteOne();

        res.json({
            success: true,
            msg: 'Question deleted successfully'
        });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to delete question',
            error: error.message
        });
    }
};

// Bulk delete questions
exports.bulkDeleteQuestions = async (req, res) => {
    try {
        const { questionIds } = req.body;

        if (!Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'Question IDs array is required'
            });
        }

        // Get first question to check permissions
        const firstQuestion = await QuizQuestion.findById(questionIds[0]);
        if (!firstQuestion) {
            return res.status(404).json({
                success: false,
                msg: 'Question not found'
            });
        }

        // Check permissions
        const quiz = await Quiz.findById(firstQuestion.quiz);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to delete questions'
            });
        }

        // Get all questions to calculate points
        const questions = await QuizQuestion.find({ _id: { $in: questionIds } });
        const totalPointsToRemove = questions.reduce((sum, q) => sum + (q.points || 1), 0);

        // Delete questions
        await QuizQuestion.deleteMany({ _id: { $in: questionIds } });

        // Update quiz
        quiz.questions = quiz.questions.filter(q => !questionIds.includes(q.toString()));
        quiz.totalPoints -= totalPointsToRemove;
        await quiz.save();

        res.json({
            success: true,
            msg: `${questionIds.length} questions deleted successfully`,
            deletedCount: questionIds.length
        });
    } catch (error) {
        console.error('Bulk delete questions error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to delete questions',
            error: error.message
        });
    }
};

// Reorder questions
exports.reorderQuestions = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { questionOrder } = req.body; // Array of question IDs in new order

        if (!Array.isArray(questionOrder) || questionOrder.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'Question order array is required'
            });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to reorder questions'
            });
        }

        // Update order for each question
        const updatePromises = questionOrder.map((questionId, index) => {
            return QuizQuestion.findByIdAndUpdate(
                questionId,
                { order: index },
                { new: true }
            );
        });

        await Promise.all(updatePromises);

        res.json({
            success: true,
            msg: 'Questions reordered successfully'
        });
    } catch (error) {
        console.error('Reorder questions error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to reorder questions',
            error: error.message
        });
    }
};

// Toggle question status
exports.toggleQuestionStatus = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { isActive } = req.body;

        const question = await QuizQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({
                success: false,
                msg: 'Question not found'
            });
        }

        // Check permissions
        const quiz = await Quiz.findById(question.quiz);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to update question status'
            });
        }

        question.isActive = isActive;
        await question.save();

        res.json({
            success: true,
            msg: `Question ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: question
        });
    } catch (error) {
        console.error('Toggle question status error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to update question status',
            error: error.message
        });
    }
};

// ==========================
// QUIZ ATTEMPTS & RESULTS
// ==========================

// Start quiz attempt
exports.startQuizAttempt = async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check if quiz is published
        if (!quiz.isPublished) {
            return res.status(400).json({
                success: false,
                msg: 'Quiz is not published'
            });
        }

        // Check if user has access to the course
        const course = await Course.findById(quiz.course);
        const isEnrolled = course.learners?.some(learnerId => 
            learnerId.toString() === req.user?._id?.toString()
        );
        
        if (!isEnrolled && !req.user?.roles?.includes('ADMIN') && !req.user?.roles?.includes('SUPERADMIN')) {
            return res.status(403).json({
                success: false,
                msg: 'You are not enrolled in this course'
            });
        }

        // Check if quiz is active
        const now = new Date();
        if (quiz.startDate && now < quiz.startDate) {
            return res.status(400).json({
                success: false,
                msg: 'Quiz has not started yet'
            });
        }

        if (quiz.endDate && now > quiz.endDate) {
            return res.status(400).json({
                success: false,
                msg: 'Quiz has ended'
            });
        }

        // Check max attempts
        const existingAttempts = await QuizScore.find({
            user: req.user._id,
            quiz: quizId
        });

        if (existingAttempts.length >= quiz.maxAttempts) {
            return res.status(400).json({
                success: false,
                msg: 'Maximum attempts reached'
            });
        }

        // Check if there's an in-progress attempt
        const inProgress = existingAttempts.find(a => a.status === 'in_progress');
        if (inProgress && quiz.isTimed) {
            const timeElapsed = Math.floor((now - inProgress.startedAt) / 1000);
            if (timeElapsed < quiz.duration * 60) {
                return res.json({
                    success: true,
                    data: {
                        attempt: inProgress,
                        timeRemaining: quiz.duration * 60 - timeElapsed
                    }
                });
            } else {
                // Time's up for previous attempt
                inProgress.status = 'timeout';
                inProgress.completedAt = now;
                await inProgress.save();
            }
        }

        // Get active questions
        const questions = await QuizQuestion.find({ 
            quiz: quizId,
            isActive: true 
        }).sort({ order: 1 });

        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'Quiz has no active questions'
            });
        }

        // Shuffle if needed
        let displayQuestions = [...questions];
        if (quiz.shuffleQuestions) {
            displayQuestions = displayQuestions.sort(() => Math.random() - 0.5);
        }

        // Shuffle options if needed
        if (quiz.shuffleOptions) {
            displayQuestions = displayQuestions.map(q => {
                const question = q.toObject();
                if (question.options) {
                    question.options = question.options.sort(() => Math.random() - 0.5);
                }
                return question;
            });
        }

        // Hide correct answers
        displayQuestions = displayQuestions.map(q => {
            const question = q.toObject();
            delete question.correctAnswers;
            if (question.questionType !== 'essay' && question.questionType !== 'short_answer') {
                if (question.options) {
                    question.options = question.options.map(opt => ({
                        text: opt.text,
                        _id: opt._id
                    }));
                }
            }
            return question;
        });

        // Create new attempt
        const attempt = new QuizScore({
            user: req.user._id,
            quiz: quizId,
            attemptNumber: existingAttempts.length + 1,
            startedAt: now,
            status: 'in_progress',
            totalQuestions: questions.length,
            maxScore: questions.reduce((sum, q) => sum + (q.points || 1), 0)
        });

        await attempt.save();

        res.json({
            success: true,
            data: {
                attempt: {
                    _id: attempt._id,
                    attemptNumber: attempt.attemptNumber,
                    startedAt: attempt.startedAt,
                    status: attempt.status
                },
                quiz: {
                    _id: quiz._id,
                    title: quiz.title,
                    duration: quiz.duration,
                    isTimed: quiz.isTimed,
                    instructions: quiz.instructions,
                    showResults: quiz.showResults
                },
                questions: displayQuestions,
                timeRemaining: quiz.duration * 60
            }
        });
    } catch (error) {
        console.error('Start quiz error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to start quiz',
            error: error.message
        });
    }
};

// Submit quiz attempt
exports.submitQuizAttempt = async (req, res) => {
    try {
        const { quizId, attemptId } = req.params;
        const { answers } = req.body;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Get attempt
        const attempt = await QuizScore.findOne({
            _id: attemptId,
            user: req.user._id,
            quiz: quizId,
            status: 'in_progress'
        });

        if (!attempt) {
            return res.status(404).json({
                success: false,
                msg: 'Attempt not found or already submitted'
            });
        }

        // Check if time is up for timed quiz
        const now = new Date();
        if (quiz.isTimed) {
            const timeElapsed = Math.floor((now - attempt.startedAt) / 1000);
            if (timeElapsed > quiz.duration * 60) {
                attempt.status = 'timeout';
                attempt.completedAt = now;
                await attempt.save();
                
                return res.status(400).json({
                    success: false,
                    msg: 'Time is up for this quiz'
                });
            }
            attempt.timeTaken = timeElapsed;
        }

        // Get all questions with correct answers
        const questions = await QuizQuestion.find({ 
            quiz: quizId,
            isActive: true 
        });
        
        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        let totalScore = 0;
        const logs = [];
        const gradedAnswers = [];

        // Evaluate each answer
        for (const answer of answers) {
            const question = questionMap[answer.questionId];
            if (!question) continue;

            let isCorrect = false;
            let pointsEarned = 0;
            let needsGrading = false;

            switch (question.questionType) {
                case 'single_choice':
                    // Find the correct option
                    const correctOption = question.options?.find(opt => opt.isCorrect);
                    isCorrect = answer.selectedOption === correctOption?._id?.toString();
                    pointsEarned = isCorrect ? (question.points || 1) : 0;
                    break;

                case 'multiple_choice':
                    // Get selected options
                    const selectedOptions = answer.selectedOptions || [];
                    const correctOptions = question.options?.filter(opt => opt.isCorrect) || [];
                    
                    // All correct options must be selected and no incorrect ones
                    const allCorrectSelected = correctOptions.every(correctOpt => 
                        selectedOptions.includes(correctOpt._id.toString())
                    );
                    const noIncorrectSelected = selectedOptions.every(selectedId => 
                        correctOptions.some(correctOpt => correctOpt._id.toString() === selectedId)
                    );
                    
                    isCorrect = allCorrectSelected && noIncorrectSelected;
                    pointsEarned = isCorrect ? (question.points || 1) : 0;
                    break;

                case 'true_false':
                    const correctAnswer = question.correctAnswers?.[0];
                    isCorrect = answer.answer?.[0] === correctAnswer;
                    pointsEarned = isCorrect ? (question.points || 1) : 0;
                    break;

                case 'short_answer':
                    // For short answer, check if answer matches (case-insensitive, trimmed)
                    const userAnswer = (answer.answer?.[0] || '').trim().toLowerCase();
                    const correctSA = (question.correctAnswers?.[0] || '').trim().toLowerCase();
                    isCorrect = userAnswer === correctSA;
                    pointsEarned = isCorrect ? (question.points || 1) : 0;
                    break;

                case 'essay':
                    // Essay needs manual grading
                    needsGrading = true;
                    pointsEarned = 0;
                    break;
            }

            totalScore += pointsEarned;

            // Create log
            const log = new QuizLog({
                questionId: answer.questionId,
                answer: answer.answer,
                selectedOptions: answer.selectedOptions,
                selectedOption: answer.selectedOption,
                isCorrect,
                pointsEarned,
                needsGrading,
                timeSpent: answer.timeSpent || 0,
                maxPoints: question.points || 1
            });

            await log.save();
            logs.push(log._id);

            // Store in attempt
            gradedAnswers.push({
                questionId: answer.questionId,
                answer: answer.answer,
                selectedOptions: answer.selectedOptions,
                selectedOption: answer.selectedOption,
                isCorrect,
                pointsEarned,
                needsGrading,
                maxPoints: question.points || 1
            });
        }

        // Calculate percentage
        const totalPossible = questions.reduce((sum, q) => sum + (q.points || 1), 0);
        const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

        // Update attempt
        attempt.score = totalScore;
        attempt.percentage = percentage;
        attempt.logs = logs;
        attempt.answers = gradedAnswers;
        attempt.status = 'completed';
        attempt.completedAt = now;
        attempt.isPassed = percentage >= quiz.passingScore;

        await attempt.save();

        res.json({
            success: true,
            data: {
                attempt: {
                    _id: attempt._id,
                    score: attempt.score,
                    percentage: attempt.percentage,
                    isPassed: attempt.isPassed,
                    completedAt: attempt.completedAt,
                    timeTaken: attempt.timeTaken
                },
                feedback: attempt.isPassed 
                    ? 'Congratulations! You passed the quiz.' 
                    : 'You did not pass the quiz. Please try again.',
                showResults: quiz.showResults,
                canReview: quiz.showResults || attempt.isPassed
            }
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to submit quiz',
            error: error.message
        });
    }
};

// Get quiz attempts
exports.getQuizAttempts = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { 
            userId, 
            status, 
            passed, 
            page = 1, 
            limit = 20,
            sortBy = 'completedAt',
            sortOrder = 'desc'
        } = req.query;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to view all quiz attempts'
            });
        }

        // Build query
        let query = { quiz: quizId };
        
        if (userId) query.user = userId;
        if (status) query.status = status;
        if (passed !== undefined) {
            query.isPassed = passed === 'true';
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get attempts
        const attempts = await QuizScore.find(query)
            .populate('user', 'firstname lastname email phone')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await QuizScore.countDocuments(query);

        // Get statistics
        const stats = await QuizScore.aggregate([
            { $match: { quiz: mongoose.Types.ObjectId(quizId) } },
            {
                $group: {
                    _id: null,
                    totalAttempts: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    averagePercentage: { $avg: '$percentage' },
                    averageTime: { $avg: '$timeTaken' },
                    passedCount: { $sum: { $cond: ['$isPassed', 1, 0] } },
                    failedCount: { $sum: { $cond: [{ $and: ['$isPassed', { $eq: ['$isPassed', false] }] }, 1, 0] } }
                }
            }
        ]);

        res.json({
            success: true,
            data: attempts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            stats: stats[0] || {
                totalAttempts: 0,
                averageScore: 0,
                averagePercentage: 0,
                averageTime: 0,
                passedCount: 0,
                failedCount: 0
            }
        });
    } catch (error) {
        console.error('Get quiz attempts error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get quiz attempts',
            error: error.message
        });
    }
};

// Get single attempt
exports.getAttempt = async (req, res) => {
    try {
        const { attemptId } = req.params;

        const attempt = await QuizScore.findById(attemptId)
            .populate('user', 'firstname lastname email')
            .populate('quiz', 'title passingScore showResults');

        if (!attempt) {
            return res.status(404).json({
                success: false,
                msg: 'Attempt not found'
            });
        }

        // Check permissions
        const quiz = await Quiz.findById(attempt.quiz);
        const course = await Course.findById(quiz.course);
        
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer && course.lecturers?.some(lecturerId => 
                lecturerId.toString() === lecturer._id.toString()
            )) {
                isLecturer = true;
            }
        }

        const isOwner = attempt.user._id.toString() === req.user._id.toString();

        if (!isAdmin && !isLecturer && !isOwner) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to view this attempt'
            });
        }

        // Get detailed logs
        const logs = await QuizLog.find({ _id: { $in: attempt.logs } })
            .populate('questionId');

        res.json({
            success: true,
            data: {
                attempt,
                logs,
                canViewDetails: isAdmin || isLecturer || (isOwner && quiz.showResults)
            }
        });
    } catch (error) {
        console.error('Get attempt error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get attempt',
            error: error.message
        });
    }
};

// Get student's attempts
exports.getStudentAttempts = async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check if user is enrolled
        const course = await Course.findById(quiz.course);
        const isEnrolled = course.learners?.some(learnerId => 
            learnerId.toString() === req.user?._id?.toString()
        );
        
        if (!isEnrolled && !req.user?.roles?.includes('ADMIN') && !req.user?.roles?.includes('SUPERADMIN')) {
            return res.status(403).json({
                success: false,
                msg: 'You are not enrolled in this course'
            });
        }

        const attempts = await QuizScore.find({
            quiz: quizId,
            user: req.user._id
        }).sort({ attemptNumber: -1 });

        // Get best attempt
        const bestAttempt = attempts.length > 0 
            ? attempts.reduce((best, current) => 
                current.percentage > best.percentage ? current : best
            )
            : null;

        res.json({
            success: true,
            data: {
                attempts,
                bestAttempt,
                maxAttempts: quiz.maxAttempts,
                remainingAttempts: Math.max(0, quiz.maxAttempts - attempts.length),
                canRetake: attempts.length < quiz.maxAttempts
            }
        });
    } catch (error) {
        console.error('Get student attempts error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get student attempts',
            error: error.message
        });
    }
};

// Delete attempt
exports.deleteAttempt = async (req, res) => {
    try {
        const { attemptId } = req.params;

        const attempt = await QuizScore.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({
                success: false,
                msg: 'Attempt not found'
            });
        }

        // Only admin/superadmin can delete attempts
        if (!req.user?.roles?.includes('ADMIN') && !req.user?.roles?.includes('SUPERADMIN')) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to delete attempts'
            });
        }

        // Delete logs
        await QuizLog.deleteMany({ _id: { $in: attempt.logs } });

        // Delete attempt
        await attempt.deleteOne();

        res.json({
            success: true,
            msg: 'Attempt deleted successfully'
        });
    } catch (error) {
        console.error('Delete attempt error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to delete attempt',
            error: error.message
        });
    }
};

// Bulk delete attempts
exports.bulkDeleteAttempts = async (req, res) => {
    try {
        const { attemptIds } = req.body;

        if (!Array.isArray(attemptIds) || attemptIds.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'Attempt IDs array is required'
            });
        }

        // Only admin/superadmin can delete attempts
        if (!req.user?.roles?.includes('ADMIN') && !req.user?.roles?.includes('SUPERADMIN')) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to delete attempts'
            });
        }

        // Get attempts to delete logs
        const attempts = await QuizScore.find({ _id: { $in: attemptIds } });
        
        // Delete all logs
        for (const attempt of attempts) {
            await QuizLog.deleteMany({ _id: { $in: attempt.logs } });
        }

        // Delete attempts
        await QuizScore.deleteMany({ _id: { $in: attemptIds } });

        res.json({
            success: true,
            msg: `${attemptIds.length} attempts deleted successfully`,
            deletedCount: attemptIds.length
        });
    } catch (error) {
        console.error('Bulk delete attempts error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to delete attempts',
            error: error.message
        });
    }
};

// Reset attempt
exports.resetAttempt = async (req, res) => {
    try {
        const { attemptId } = req.params;

        const attempt = await QuizScore.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({
                success: false,
                msg: 'Attempt not found'
            });
        }

        // Check permissions
        const quiz = await Quiz.findById(attempt.quiz);
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to reset attempts'
            });
        }

        // Delete logs
        await QuizLog.deleteMany({ _id: { $in: attempt.logs } });

        // Reset attempt
        attempt.score = 0;
        attempt.percentage = 0;
        attempt.logs = [];
        attempt.answers = [];
        attempt.status = 'in_progress';
        attempt.completedAt = null;
        attempt.timeTaken = 0;
        attempt.isPassed = false;

        await attempt.save();

        res.json({
            success: true,
            msg: 'Attempt reset successfully',
            data: attempt
        });
    } catch (error) {
        console.error('Reset attempt error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to reset attempt',
            error: error.message
        });
    }
};

// ==========================
// RESULTS & ANALYTICS
// ==========================

// Get quiz results
exports.getQuizResults = async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        let attempts;
        if (isAdmin || isLecturer) {
            // Get all attempts with user details
            attempts = await QuizScore.find({ quiz: quizId })
                .populate('user', 'firstname lastname email phone')
                .sort({ completedAt: -1 });
        } else {
            // Get only user's attempts
            attempts = await QuizScore.find({
                quiz: quizId,
                user: req.user._id
            }).sort({ attemptNumber: 1 });
        }

        // Get questions for analysis (admin/lecturer only)
        let questions = [];
        if (isAdmin || isLecturer) {
            questions = await QuizQuestion.find({ quiz: quizId });
        }

        // Calculate statistics
        const stats = {
            totalAttempts: attempts.length,
            uniqueStudents: isAdmin || isLecturer 
                ? [...new Set(attempts.map(a => a.user._id.toString()))].length 
                : 1,
            averageScore: attempts.length > 0 
                ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length 
                : 0,
            averagePercentage: attempts.length > 0 
                ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length 
                : 0,
            passRate: attempts.length > 0 
                ? (attempts.filter(a => a.isPassed).length / attempts.length) * 100 
                : 0,
            bestScore: attempts.length > 0 
                ? Math.max(...attempts.map(a => a.percentage)) 
                : 0,
            worstScore: attempts.length > 0 
                ? Math.min(...attempts.map(a => a.percentage)) 
                : 0
        };

        res.json({
            success: true,
            data: {
                quiz,
                attempts,
                questions,
                statistics: stats,
                isInstructor: isAdmin || isLecturer
            }
        });
    } catch (error) {
        console.error('Get quiz results error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get quiz results',
            error: error.message
        });
    }
};

// Get quiz analytics
exports.getQuizAnalytics = async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to view quiz analytics'
            });
        }

        // Get all attempts
        const attempts = await QuizScore.find({ quiz: quizId })
            .populate('user', 'firstname lastname');

        if (attempts.length === 0) {
            return res.json({
                success: true,
                data: {
                    quiz,
                    attempts: [],
                    analytics: {
                        scoreDistribution: [],
                        timeDistribution: [],
                        dailySubmissions: [],
                        questionPerformance: []
                    },
                    summary: {
                        totalAttempts: 0,
                        uniqueStudents: 0,
                        averageScore: 0,
                        passRate: 0,
                        completionRate: 0
                    }
                }
            });
        }

        // Score distribution
        const scoreDistribution = [
            { range: '0-49%', count: attempts.filter(a => a.percentage < 50).length },
            { range: '50-69%', count: attempts.filter(a => a.percentage >= 50 && a.percentage < 70).length },
            { range: '70-89%', count: attempts.filter(a => a.percentage >= 70 && a.percentage < 90).length },
            { range: '90-100%', count: attempts.filter(a => a.percentage >= 90).length }
        ];

        // Time distribution
        const timeDistribution = [
            { range: '< 25%', count: attempts.filter(a => a.timeTaken < quiz.duration * 60 * 0.25).length },
            { range: '25-50%', count: attempts.filter(a => a.timeTaken >= quiz.duration * 60 * 0.25 && a.timeTaken < quiz.duration * 60 * 0.5).length },
            { range: '50-75%', count: attempts.filter(a => a.timeTaken >= quiz.duration * 60 * 0.5 && a.timeTaken < quiz.duration * 60 * 0.75).length },
            { range: '75-100%', count: attempts.filter(a => a.timeTaken >= quiz.duration * 60 * 0.75 && a.timeTaken <= quiz.duration * 60).length },
            { range: '> 100%', count: attempts.filter(a => a.timeTaken > quiz.duration * 60).length }
        ];

        // Daily submissions (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const dailySubmissions = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const count = attempts.filter(a => 
                a.completedAt >= date && a.completedAt < nextDate
            ).length;
            
            dailySubmissions.unshift({
                date: date.toISOString().split('T')[0],
                count
            });
        }

        // Summary statistics
        const uniqueStudents = [...new Set(attempts.map(a => a.user._id.toString()))].length;
        const averageScore = attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length;
        const passRate = (attempts.filter(a => a.isPassed).length / attempts.length) * 100;
        const completionRate = (attempts.filter(a => a.status === 'completed').length / attempts.length) * 100;

        res.json({
            success: true,
            data: {
                quiz,
                attempts: attempts.slice(0, 50), // Return recent attempts
                analytics: {
                    scoreDistribution,
                    timeDistribution,
                    dailySubmissions,
                    // questionPerformance will be handled by separate endpoint
                },
                summary: {
                    totalAttempts: attempts.length,
                    uniqueStudents,
                    averageScore,
                    passRate,
                    completionRate,
                    averageTime: attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / attempts.length,
                    bestScore: Math.max(...attempts.map(a => a.percentage)),
                    worstScore: Math.min(...attempts.map(a => a.percentage))
                }
            }
        });
    } catch (error) {
        console.error('Get quiz analytics error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get quiz analytics',
            error: error.message
        });
    }
};

// Get question analysis
exports.getQuestionAnalysis = async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to view question analysis'
            });
        }

        // Get all questions
        const questions = await QuizQuestion.find({ quiz: quizId }).sort({ order: 1 });

        // Get all attempts and logs
        const attempts = await QuizScore.find({ quiz: quizId });
        const allLogs = await QuizLog.find({ 
            _id: { $in: attempts.flatMap(a => a.logs) } 
        }).populate('questionId');

        // Analyze each question
        const questionAnalysis = questions.map(question => {
            const questionLogs = allLogs.filter(log => 
                log.questionId._id.toString() === question._id.toString()
            );
            
            const totalAttempts = questionLogs.length;
            const correctAttempts = questionLogs.filter(log => log.isCorrect).length;
            const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
            
            // Calculate average time spent
            const totalTime = questionLogs.reduce((sum, log) => sum + (log.timeSpent || 0), 0);
            const averageTime = totalAttempts > 0 ? totalTime / totalAttempts : 0;
            
            // Most common wrong answer (for MCQ)
            let commonWrongAnswer = null;
            if (question.questionType === 'single_choice' || question.questionType === 'multiple_choice') {
                const wrongLogs = questionLogs.filter(log => !log.isCorrect);
                const wrongAnswers = {};
                wrongLogs.forEach(log => {
                    if (log.selectedOption) {
                        wrongAnswers[log.selectedOption] = (wrongAnswers[log.selectedOption] || 0) + 1;
                    }
                });
                
                const mostCommon = Object.entries(wrongAnswers)
                    .sort((a, b) => b[1] - a[1])
                    .shift();
                
                if (mostCommon) {
                    const wrongOption = question.options.find(opt => opt._id.toString() === mostCommon[0]);
                    commonWrongAnswer = wrongOption ? wrongOption.text : `Option ${mostCommon[0]}`;
                }
            }

            return {
                questionId: question._id,
                questionText: question.questionText.substring(0, 100) + (question.questionText.length > 100 ? '...' : ''),
                questionType: question.questionType,
                difficulty: question.difficulty,
                points: question.points,
                totalAttempts,
                correctAttempts,
                wrongAttempts: totalAttempts - correctAttempts,
                accuracy,
                averageTime,
                commonWrongAnswer,
                needsGradingCount: questionLogs.filter(log => log.needsGrading).length
            };
        });

        // Overall statistics
        const totalQuestions = questions.length;
        const totalAttemptsCount = attempts.length;
        const averageQuestionAccuracy = questionAnalysis.length > 0 
            ? questionAnalysis.reduce((sum, q) => sum + q.accuracy, 0) / questionAnalysis.length 
            : 0;

        // Identify problematic questions (accuracy < 50%)
        const problematicQuestions = questionAnalysis.filter(q => q.accuracy < 50 && q.totalAttempts > 0);

        res.json({
            success: true,
            data: {
                quiz: {
                    _id: quiz._id,
                    title: quiz.title,
                    totalQuestions,
                    totalAttempts: totalAttemptsCount
                },
                questionAnalysis,
                summary: {
                    totalQuestions,
                    totalAttempts: totalAttemptsCount,
                    averageAccuracy: averageQuestionAccuracy,
                    problematicQuestions: problematicQuestions.length,
                    easiestQuestion: questionAnalysis.length > 0 
                        ? questionAnalysis.reduce((max, q) => q.accuracy > max.accuracy ? q : max)
                        : null,
                    hardestQuestion: questionAnalysis.length > 0 
                        ? questionAnalysis.reduce((min, q) => q.accuracy < min.accuracy ? q : min)
                        : null
                }
            }
        });
    } catch (error) {
        console.error('Get question analysis error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get question analysis',
            error: error.message
        });
    }
};

// Get time analytics
exports.getTimeAnalytics = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { period = '7d' } = req.query; // 7d, 30d, 90d, all

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to view time analytics'
            });
        }

        // Calculate date range
        let startDate = new Date();
        switch (period) {
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                break;
            default:
                startDate.setDate(startDate.getDate() - 7);
        }

        // Get attempts in date range
        const attempts = await QuizScore.find({
            quiz: quizId,
            completedAt: { $gte: startDate }
        }).sort({ completedAt: 1 });

        if (attempts.length === 0) {
            return res.json({
                success: true,
                data: {
                    timeSeries: [],
                    hourlyDistribution: [],
                    weeklyDistribution: [],
                    summary: {
                        totalAttempts: 0,
                        averageTime: 0,
                        fastestAttempt: 0,
                        slowestAttempt: 0
                    }
                }
            });
        }

        // Time series data (attempts over time)
        const timeSeries = [];
        const currentDate = new Date(startDate);
        const endDate = new Date();
        
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const count = attempts.filter(a => {
                const attemptDate = new Date(a.completedAt);
                return attemptDate >= currentDate && attemptDate < nextDate;
            }).length;
            
            timeSeries.push({
                date: dateStr,
                count,
                averageScore: count > 0 
                    ? attempts
                        .filter(a => {
                            const attemptDate = new Date(a.completedAt);
                            return attemptDate >= currentDate && attemptDate < nextDate;
                        })
                        .reduce((sum, a) => sum + a.percentage, 0) / count 
                    : 0
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Hourly distribution
        const hourlyDistribution = Array(24).fill(0).map((_, hour) => {
            const count = attempts.filter(a => {
                const attemptHour = new Date(a.completedAt).getHours();
                return attemptHour === hour;
            }).length;
            return { hour, count };
        });

        // Weekly distribution (day of week)
        const weeklyDistribution = [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        ].map((day, index) => {
            const count = attempts.filter(a => {
                const attemptDay = new Date(a.completedAt).getDay();
                return attemptDay === index;
            }).length;
            return { day, count };
        });

        // Summary statistics
        const totalTime = attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0);
        const averageTime = attempts.length > 0 ? totalTime / attempts.length : 0;
        const fastestAttempt = attempts.length > 0 ? Math.min(...attempts.map(a => a.timeTaken || 0)) : 0;
        const slowestAttempt = attempts.length > 0 ? Math.max(...attempts.map(a => a.timeTaken || 0)) : 0;

        // Peak hours
        const peakHour = hourlyDistribution.reduce((max, curr) => 
            curr.count > max.count ? curr : max
        , { hour: 0, count: 0 });

        res.json({
            success: true,
            data: {
                timeSeries,
                hourlyDistribution,
                weeklyDistribution,
                summary: {
                    totalAttempts: attempts.length,
                    averageTime,
                    fastestAttempt,
                    slowestAttempt,
                    peakHour: {
                        hour: peakHour.hour,
                        count: peakHour.count,
                        timeRange: `${peakHour.hour}:00 - ${peakHour.hour + 1}:00`
                    },
                    busiestDay: weeklyDistribution.reduce((max, curr) => 
                        curr.count > max.count ? curr : max
                    , { day: 'Sunday', count: 0 })
                }
            }
        });
    } catch (error) {
        console.error('Get time analytics error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get time analytics',
            error: error.message
        });
    }
};

// Export attempts as CSV
exports.exportAttempts = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { format = 'csv' } = req.query;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to export attempts'
            });
        }

        // Get all attempts with user details
        const attempts = await QuizScore.find({ quiz: quizId })
            .populate('user', 'firstname lastname email phone')
            .sort({ completedAt: -1 });

        // Get questions
        const questions = await QuizQuestion.find({ quiz: quizId }).sort({ order: 1 });

        if (format === 'csv') {
            // Prepare CSV headers
            let csv = 'Student Name,Student Email,Attempt Number,Score,Percentage,Passed,Time Taken (s),Started At,Completed At\n';
            
            // Add data rows
            attempts.forEach(attempt => {
                const row = [
                    `"${attempt.user.firstname} ${attempt.user.lastname}"`,
                    `"${attempt.user.email || ''}"`,
                    attempt.attemptNumber,
                    attempt.score,
                    attempt.percentage.toFixed(2),
                    attempt.isPassed ? 'Yes' : 'No',
                    attempt.timeTaken || 0,
                    new Date(attempt.startedAt).toISOString(),
                    attempt.completedAt ? new Date(attempt.completedAt).toISOString() : ''
                ];
                csv += row.join(',') + '\n';
            });

            // Set headers for CSV download
            res.header('Content-Type', 'text/csv');
            res.attachment(`quiz-attempts-${quizId}-${Date.now()}.csv`);
            res.send(csv);
        } else {
            // JSON format
            res.json({
                success: true,
                data: {
                    quiz: {
                        _id: quiz._id,
                        title: quiz.title,
                        course: course.courseTitle,
                        passingScore: quiz.passingScore
                    },
                    attempts: attempts.map(attempt => ({
                        student: {
                            name: `${attempt.user.firstname} ${attempt.user.lastname}`,
                            email: attempt.user.email,
                            phone: attempt.user.phone
                        },
                        attemptNumber: attempt.attemptNumber,
                        score: attempt.score,
                        percentage: attempt.percentage,
                        isPassed: attempt.isPassed,
                        timeTaken: attempt.timeTaken,
                        startedAt: attempt.startedAt,
                        completedAt: attempt.completedAt,
                        status: attempt.status
                    })),
                    questions: questions.map(q => ({
                        id: q._id,
                        questionText: q.questionText,
                        questionType: q.questionType,
                        points: q.points,
                        difficulty: q.difficulty
                    })),
                    exportDate: new Date(),
                    exportedBy: {
                        name: `${req.user.firstname} ${req.user.lastname}`,
                        email: req.user.email
                    }
                }
            });
        }
    } catch (error) {
        console.error('Export attempts error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to export attempts',
            error: error.message
        });
    }
};

// ==========================
// ESSAY GRADING
// ==========================

// Grade essay question
exports.gradeEssayQuestion = async (req, res) => {
    try {
        const { attemptId, questionId } = req.params;
        const { score, feedback } = req.body;

        const attempt = await QuizScore.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({
                success: false,
                msg: 'Attempt not found'
            });
        }

        // Check permissions
        const quiz = await Quiz.findById(attempt.quiz);
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to grade essays'
            });
        }

        // Find the question
        const question = await QuizQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({
                success: false,
                msg: 'Question not found'
            });
        }

        // Validate score
        const maxScore = question.points || 1;
        if (score < 0 || score > maxScore) {
            return res.status(400).json({
                success: false,
                msg: `Score must be between 0 and ${maxScore}`
            });
        }

        // Find and update the answer in attempt
        const answerIndex = attempt.answers.findIndex(a => 
            a.questionId.toString() === questionId
        );

        if (answerIndex === -1) {
            return res.status(404).json({
                success: false,
                msg: 'Question answer not found in attempt'
            });
        }

        // Update answer
        attempt.answers[answerIndex].pointsEarned = score;
        attempt.answers[answerIndex].isCorrect = score > 0;
        attempt.answers[answerIndex].feedback = feedback;
        attempt.answers[answerIndex].needsGrading = false;
        attempt.answers[answerIndex].gradedBy = req.user._id;
        attempt.answers[answerIndex].gradedAt = new Date();

        // Recalculate total score
        attempt.score = attempt.answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
        attempt.percentage = quiz.totalPoints > 0 ? (attempt.score / quiz.totalPoints) * 100 : 0;
        attempt.isPassed = attempt.percentage >= quiz.passingScore;

        // Update corresponding log
        const log = await QuizLog.findOne({
            _id: { $in: attempt.logs },
            questionId: questionId
        });

        if (log) {
            log.pointsEarned = score;
            log.isCorrect = score > 0;
            log.needsGrading = false;
            log.feedback = feedback;
            log.gradedBy = req.user._id;
            log.gradedAt = new Date();
            await log.save();
        }

        await attempt.save();

        res.json({
            success: true,
            msg: 'Essay graded successfully',
            data: {
                attempt: {
                    _id: attempt._id,
                    score: attempt.score,
                    percentage: attempt.percentage,
                    isPassed: attempt.isPassed
                },
                gradedQuestion: {
                    questionId,
                    score,
                    maxScore,
                    feedback
                }
            }
        });
    } catch (error) {
        console.error('Grade essay error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to grade essay',
            error: error.message
        });
    }
};

// Get questions needing grading
exports.getQuestionsNeedingGrading = async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to view grading queue'
            });
        }

        // Get attempts with questions needing grading
        const attempts = await QuizScore.find({
            quiz: quizId,
            'answers.needsGrading': true
        })
        .populate('user', 'firstname lastname email')
        .sort({ completedAt: -1 });

        // Collect questions needing grading
        const gradingQueue = [];
        
        for (const attempt of attempts) {
            for (const answer of attempt.answers) {
                if (answer.needsGrading) {
                    const question = await QuizQuestion.findById(answer.questionId);
                    if (question) {
                        gradingQueue.push({
                            attemptId: attempt._id,
                            questionId: answer.questionId,
                            student: {
                                _id: attempt.user._id,
                                name: `${attempt.user.firstname} ${attempt.user.lastname}`,
                                email: attempt.user.email
                            },
                            question: {
                                _id: question._id,
                                questionText: question.questionText,
                                questionType: question.questionType,
                                points: question.points
                            },
                            answer: answer.answer,
                            maxPoints: answer.maxPoints || question.points,
                            submittedAt: attempt.completedAt,
                            attemptNumber: attempt.attemptNumber
                        });
                    }
                }
            }
        }

        res.json({
            success: true,
            data: {
                quiz: {
                    _id: quiz._id,
                    title: quiz.title,
                    requiresGrading: quiz.requiresGrading
                },
                gradingQueue,
                totalNeedingGrading: gradingQueue.length
            }
        });
    } catch (error) {
        console.error('Get questions needing grading error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get grading queue',
            error: error.message
        });
    }
};

// ==========================
// EXPORT/IMPORT
// ==========================

// Export quiz (for backup/template)
exports.exportQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { includeAttempts = 'false' } = req.query;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to export this quiz'
            });
        }

        const questions = await QuizQuestion.find({ quiz: quizId }).sort({ order: 1 });

        const exportData = {
            quiz: {
                ...quiz.toObject(),
                _id: undefined,
                postedBy: undefined,
                questions: undefined,
                createdAt: undefined,
                updatedAt: undefined
            },
            questions: questions.map(q => ({
                ...q.toObject(),
                _id: undefined,
                quiz: undefined,
                addedBy: undefined,
                createdAt: undefined,
                updatedAt: undefined
            })),
            metadata: {
                exportDate: new Date(),
                exportedBy: {
                    id: req.user._id,
                    name: `${req.user.firstname} ${req.user.lastname}`,
                    email: req.user.email
                },
                totalQuestions: questions.length,
                totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0)
            }
        };

        // Include attempts if requested
        if (includeAttempts === 'true') {
            const attempts = await QuizScore.find({ quiz: quizId })
                .populate('user', 'firstname lastname email')
                .limit(100); // Limit to recent 100 attempts
            
            exportData.attempts = attempts.map(a => ({
                ...a.toObject(),
                _id: undefined,
                quiz: undefined,
                logs: undefined,
                user: {
                    name: `${a.user.firstname} ${a.user.lastname}`,
                    email: a.user.email
                }
            }));
            
            exportData.metadata.totalAttempts = attempts.length;
        }

        res.json({
            success: true,
            data: exportData
        });
    } catch (error) {
        console.error('Export quiz error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to export quiz',
            error: error.message
        });
    }
};

// Import questions (CSV/Excel)
exports.importQuestions = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { questions } = req.body;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to import questions'
            });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'Questions array is required'
            });
        }

        // Get current max order
        const lastQuestion = await QuizQuestion.findOne({ quiz: quizId })
            .sort({ order: -1 });
        let currentOrder = lastQuestion ? lastQuestion.order + 1 : 0;

        const importedQuestions = [];
        const errors = [];
        let totalPointsAdded = 0;

        // Import each question
        for (const [index, questionData] of questions.entries()) {
            try {
                // Validate required fields
                if (!questionData.questionText || !questionData.questionText.trim()) {
                    errors.push(`Question ${index + 1}: Question text is required`);
                    continue;
                }

                if (!questionData.questionType) {
                    errors.push(`Question ${index + 1}: Question type is required`);
                    continue;
                }

                // Set default values
                const question = new QuizQuestion({
                    quiz: quizId,
                    questionText: questionData.questionText.trim(),
                    questionType: questionData.questionType,
                    options: questionData.options || [],
                    correctAnswers: questionData.correctAnswers || [],
                    explanation: questionData.explanation?.trim() || '',
                    difficulty: questionData.difficulty || 'medium',
                    points: parseInt(questionData.points) || 1,
                    isActive: questionData.isActive !== false,
                    tags: questionData.tags || [],
                    order: currentOrder++,
                    addedBy: req.user._id,
                    maxPoints: parseInt(questionData.points) || 1
                });

                // Validate based on question type
                if (question.questionType === 'multiple_choice' || question.questionType === 'single_choice') {
                    if (!question.options || question.options.length < 2) {
                        errors.push(`Question ${index + 1}: At least 2 options are required for choice questions`);
                        continue;
                    }
                    if (!question.correctAnswers || question.correctAnswers.length === 0) {
                        errors.push(`Question ${index + 1}: Correct answer(s) are required`);
                        continue;
                    }
                }

                if (question.questionType === 'true_false') {
                    if (!question.correctAnswers || question.correctAnswers.length === 0) {
                        errors.push(`Question ${index + 1}: Correct answer is required for true/false questions`);
                        continue;
                    }
                }

                await question.save();
                importedQuestions.push(question._id);
                totalPointsAdded += question.points;

            } catch (error) {
                errors.push(`Question ${index + 1}: ${error.message}`);
            }
        }

        if (importedQuestions.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'No questions were imported',
                errors
            });
        }

        // Update quiz
        quiz.questions = [...quiz.questions, ...importedQuestions];
        quiz.totalPoints += totalPointsAdded;
        await quiz.save();

        res.status(201).json({
            success: true,
            msg: `Successfully imported ${importedQuestions.length} questions`,
            data: { 
                importedCount: importedQuestions.length,
                totalPointsAdded,
                errors: errors.length > 0 ? errors : undefined
            }
        });
    } catch (error) {
        console.error('Import questions error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to import questions',
            error: error.message
        });
    }
};

// Export questions as CSV
exports.exportQuestions = async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                msg: 'Quiz not found'
            });
        }

        // Check permissions
        const course = await Course.findById(quiz.course);
        const isAdmin = req.user?.roles?.includes('ADMIN') || req.user?.roles?.includes('SUPERADMIN');
        
        let isLecturer = false;
        if (req.user?.roles?.includes('LECTURER')) {
            const lecturer = await Lecturer.findOne({ 
                user: req.user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const isAssigned = course.lecturers?.some(lecturerId => 
                    lecturerId.toString() === lecturer._id.toString()
                );
                const isCreator = course.createdBy?.toString() === req.user._id.toString();
                isLecturer = isAssigned || isCreator;
            }
        }

        if (!isAdmin && !isLecturer) {
            return res.status(403).json({
                success: false,
                msg: 'Unauthorized to export questions'
            });
        }

        const questions = await QuizQuestion.find({ quiz: quizId }).sort({ order: 1 });

        // Prepare CSV
        let csv = 'Order,Question Text,Question Type,Options,Correct Answers,Explanation,Difficulty,Points,Tags,Is Active\n';
        
        questions.forEach(q => {
            const row = [
                q.order,
                `"${q.questionText.replace(/"/g, '""')}"`,
                q.questionType,
                `"${JSON.stringify(q.options || []).replace(/"/g, '""')}"`,
                `"${JSON.stringify(q.correctAnswers || []).replace(/"/g, '""')}"`,
                `"${(q.explanation || '').replace(/"/g, '""')}"`,
                q.difficulty,
                q.points,
                `"${(q.tags || []).join(',')}"`,
                q.isActive ? 'Yes' : 'No'
            ];
            csv += row.join(',') + '\n';
        });

        // Set headers for CSV download
        res.header('Content-Type', 'text/csv');
        res.attachment(`quiz-questions-${quizId}-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export questions error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to export questions',
            error: error.message
        });
    }
};

// Get quizzes for dashboard
exports.getDashboardQuizzes = async (req, res) => {
    try {
        const user = req.user;
        const { limit = 10, status = 'active' } = req.query;

        let quizzes = [];
        
        if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN')) {
            // Admin can see all quizzes
            const query = {};
            if (status === 'active') {
                query.isPublished = true;
                const now = new Date();
                query.$or = [
                    { startDate: { $exists: false } },
                    { startDate: { $lte: now } }
                ];
                query.$or.push(
                    { endDate: { $exists: false } },
                    { endDate: { $gte: now } }
                );
            } else if (status === 'draft') {
                query.isPublished = false;
            } else if (status === 'published') {
                query.isPublished = true;
            }
            
            quizzes = await Quiz.find(query)
                .populate('course', 'courseTitle')
                .populate('postedBy', 'firstname lastname')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));
                
        } else if (user.roles.includes('LECTURER')) {
            // Lecturer can see quizzes for their courses
            const lecturer = await Lecturer.findOne({ 
                user: user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                // Get courses where lecturer is assigned
                const courses = await Course.find({
                    $or: [
                        { lecturers: lecturer._id },
                        { createdBy: user._id }
                    ]
                }).select('_id');
                
                const courseIds = courses.map(c => c._id);
                
                const query = { course: { $in: courseIds } };
                if (status === 'active') {
                    query.isPublished = true;
                    const now = new Date();
                    query.$or = [
                        { startDate: { $exists: false } },
                        { startDate: { $lte: now } }
                    ];
                    query.$or.push(
                        { endDate: { $exists: false } },
                        { endDate: { $gte: now } }
                    );
                } else if (status === 'draft') {
                    query.isPublished = false;
                } else if (status === 'published') {
                    query.isPublished = true;
                }
                
                quizzes = await Quiz.find(query)
                    .populate('course', 'courseTitle')
                    .populate('postedBy', 'firstname lastname')
                    .sort({ createdAt: -1 })
                    .limit(parseInt(limit));
            }
            
        } else {
            // Student can see quizzes for enrolled courses
            const enrolledCourses = await Course.find({
                learners: user._id
            }).select('_id');
            
            const courseIds = enrolledCourses.map(c => c._id);
            
            const query = { 
                course: { $in: courseIds },
                isPublished: true 
            };
            
            if (status === 'active') {
                const now = new Date();
                query.$or = [
                    { startDate: { $exists: false } },
                    { startDate: { $lte: now } }
                ];
                query.$or.push(
                    { endDate: { $exists: false } },
                    { endDate: { $gte: now } }
                );
            }
            
            quizzes = await Quiz.find(query)
                .populate('course', 'courseTitle')
                .populate('postedBy', 'firstname lastname')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));
            
            // Add attempt info for students
            for (const quiz of quizzes) {
                const attempts = await QuizScore.find({
                    user: user._id,
                    quiz: quiz._id
                }).sort({ createdAt: -1 });
                
                quiz._doc.attempts = attempts;
                quiz._doc.lastAttempt = attempts[0];
                quiz._doc.attemptCount = attempts.length;
                quiz._doc.canRetake = attempts.length < quiz.maxAttempts;
                quiz._doc.bestScore = attempts.length > 0 
                    ? Math.max(...attempts.map(a => a.percentage)) 
                    : null;
            }
        }

        // Get statistics
        const stats = {
            total: quizzes.length,
            active: quizzes.filter(q => {
                if (!q.isPublished) return false;
                const now = new Date();
                return (!q.startDate || q.startDate <= now) && (!q.endDate || q.endDate >= now);
            }).length,
            draft: quizzes.filter(q => !q.isPublished).length,
            completed: quizzes.filter(q => {
                if (!q.isPublished) return false;
                const now = new Date();
                return q.endDate && q.endDate < now;
            }).length
        };

        res.json({
            success: true,
            data: quizzes,
            stats
        });
    } catch (error) {
        console.error('Get dashboard quizzes error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to get dashboard quizzes',
            error: error.message
        });
    }
};

// Search quizzes
exports.searchQuizzes = async (req, res) => {
    try {
        const { q, courseId, limit = 20 } = req.query;
        const user = req.user;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                msg: 'Search query must be at least 2 characters'
            });
        }

        let query = {
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        };

        // Filter by course if specified
        if (courseId) {
            query.course = courseId;
        }

        // Apply permissions
        if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN')) {
            // Admin can see all
        } else if (user.roles.includes('LECTURER')) {
            // Lecturer can see quizzes for their courses
            const lecturer = await Lecturer.findOne({ 
                user: user._id,
                requestStatus: 'approved',
                isActive: true 
            });
            
            if (lecturer) {
                const courses = await Course.find({
                    $or: [
                        { lecturers: lecturer._id },
                        { createdBy: user._id }
                    ]
                }).select('_id');
                
                const courseIds = courses.map(c => c._id);
                query.course = { $in: courseIds };
            } else {
                return res.json({
                    success: true,
                    data: [],
                    total: 0
                });
            }
        } else {
            // Student can only see published quizzes
            query.isPublished = true;
            
            // Only for enrolled courses
            const enrolledCourses = await Course.find({
                learners: user._id
            }).select('_id');
            
            const courseIds = enrolledCourses.map(c => c._id);
            query.course = { $in: courseIds };
        }

        const quizzes = await Quiz.find(query)
            .populate('course', 'courseTitle courseCode')
            .populate('postedBy', 'firstname lastname')
            .limit(parseInt(limit))
            .sort({ title: 1 });

        const total = await Quiz.countDocuments(query);

        res.json({
            success: true,
            data: quizzes,
            total
        });
    } catch (error) {
        console.error('Search quizzes error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to search quizzes',
            error: error.message
        });
    }
};