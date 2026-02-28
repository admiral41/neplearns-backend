const router = require("express").Router();
const courseController = require("../controllers/course.controller");
const { verifyUser, verifyAdmin, verifyLecturer, verifyRole, checkAuth } = require("../middlewares/auth");

// ======================= PUBLIC ROUTES =======================

/**
 * @swagger
 * /course:
 *   get:
 *     summary: Get all published courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 */
router.get("/", checkAuth, courseController.getAllCourses);

/**
 * @swagger
 * /course/search:
 *   get:
 *     summary: Search courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search", checkAuth, courseController.search);

/**
 * @swagger
 * /course/{slug}:
 *   get:
 *     summary: Get course details by slug
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Course slug
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get("/:slug", checkAuth, courseController.getCourseDetails);

// ======================= AUTHENTICATED ROUTES =======================

/**
 * @swagger
 * /course/{slug}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Course slug
 *     responses:
 *       200:
 *         description: Successfully enrolled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
router.post("/:slug/enroll", verifyUser, courseController.enrollInCourse);

/**
 * @swagger
 * /course/my-courses/all:
 *   get:
 *     summary: Get user's courses (enrolled, teaching, or created)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [enrolled, teaching, created, pending]
 *           default: enrolled
 *         description: Type of courses to get
 *     responses:
 *       200:
 *         description: List of user's courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 */
router.get("/my-courses/all", verifyUser, courseController.getMyCourses);

// ======================= LECTURER ROUTES =======================

/**
 * @swagger
 * /course/instructor/recent-enrollments:
 *   get:
 *     summary: Get recent enrollments for instructor's courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of enrollments to return
 *     responses:
 *       200:
 *         description: List of recent enrollments
 *       401:
 *         description: Unauthorized
 */
router.get("/instructor/recent-enrollments", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), courseController.getInstructorRecentEnrollments);

/**
 * @swagger
 * /course/instructor/students:
 *   get:
 *     summary: Get all students enrolled in instructor's courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by student name or email
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, inactive]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: List of students with pagination and stats
 *       401:
 *         description: Unauthorized
 */
router.get("/instructor/students", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), courseController.getInstructorStudents);

/**
 * @swagger
 * /course/instructor/analytics:
 *   get:
 *     summary: Get analytics data for instructor's courses and tutoring
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days, year]
 *           default: 30days
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Analytics data
 *       401:
 *         description: Unauthorized
 */
router.get("/instructor/analytics", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), courseController.getInstructorAnalytics);

/**
 * @swagger
 * /course/create:
 *   post:
 *     summary: Create a new course (Lecturer only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - courseTitle
 *               - courseDesc
 *               - learn_type
 *               - category
 *               - duration
 *               - weekly_study
 *             properties:
 *               courseTitle:
 *                 type: string
 *               courseDesc:
 *                 type: string
 *               courseShortDesc:
 *                 type: string
 *               learn_type:
 *                 type: string
 *                 enum: [PAID, FREE]
 *               category:
 *                 type: string
 *               duration:
 *                 type: number
 *               weekly_study:
 *                 type: number
 *               price:
 *                 type: number
 *               discount:
 *                 type: number
 *               tags:
 *                 type: string
 *               requirements:
 *                 type: string
 *               embeddedUrl:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Course created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a verified lecturer
 */
router.post("/create", verifyLecturer, courseController.createCourse);

/**
 * @swagger
 * /course/{slug}:
 *   put:
 *     summary: Update a course (Lecturer/Admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               courseTitle:
 *                 type: string
 *               courseDesc:
 *                 type: string
 *               courseShortDesc:
 *                 type: string
 *               learn_type:
 *                 type: string
 *                 enum: [PAID, FREE]
 *               category:
 *                 type: string
 *               duration:
 *                 type: number
 *               weekly_study:
 *                 type: number
 *               price:
 *                 type: number
 *               discount:
 *                 type: number
 *               tags:
 *                 type: string
 *               requirements:
 *                 type: string
 *               embeddedUrl:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Course updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this course
 *       404:
 *         description: Course not found
 */
router.put("/:slug", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), courseController.updateCourse);

/**
 * @swagger
 * /course/my-courses/teaching:
 *   get:
 *     summary: Get courses taught by current lecturer
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses
 *       401:
 *         description: Unauthorized
 */
router.get("/my-courses/teaching", verifyLecturer, courseController.getMyCourses);

// ======================= ADMIN ROUTES =======================

/**
 * @swagger
 * /course/admin/pending:
 *   get:
 *     summary: Get pending course requests (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of pending courses
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/admin/pending", verifyAdmin, courseController.getPendingCourseRequests);

/**
 * @swagger
 * /course/admin/{id}/process:
 *   put:
 *     summary: Approve or reject a course request (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *                 description: Reason for rejection (required if action=reject)
 *               publishDirectly:
 *                 type: boolean
 *                 default: false
 *                 description: Publish immediately after approval
 *     responses:
 *       200:
 *         description: Course request processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put("/admin/:id/process", verifyAdmin, courseController.processCourseRequest);

/**
 * @swagger
 * /course/admin/{slug}/publish:
 *   put:
 *     summary: Toggle course publish status (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publish
 *             properties:
 *               publish:
 *                 type: boolean
 *                 description: true to publish, false to unpublish
 *     responses:
 *       200:
 *         description: Publish status toggled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put("/admin/:slug/publish", verifyAdmin, courseController.toggleCoursePublish);

/**
 * @swagger
 * /course/admin/create:
 *   post:
 *     summary: Create a course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - courseTitle
 *               - courseDesc
 *               - learn_type
 *               - category
 *               - duration
 *               - weekly_study
 *             properties:
 *               courseTitle:
 *                 type: string
 *               courseDesc:
 *                 type: string
 *               courseShortDesc:
 *                 type: string
 *               learn_type:
 *                 type: string
 *                 enum: [PAID, FREE]
 *               category:
 *                 type: string
 *               duration:
 *                 type: number
 *               weekly_study:
 *                 type: number
 *               price:
 *                 type: number
 *               discount:
 *                 type: number
 *               tags:
 *                 type: string
 *               requirements:
 *                 type: string
 *               embeddedUrl:
 *                 type: string
 *               lecturers:
 *                 type: array
 *                 items:
 *                   type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Course created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post("/admin/create", verifyAdmin, courseController.createCourse);

/**
 * @swagger
 * /course/admin/{slug}/assign-lecturers:
 *   put:
 *     summary: Assign lecturers to a course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lecturers
 *             properties:
 *               lecturers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Lecturers assigned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put("/admin/:slug/assign-lecturers", verifyAdmin, courseController.assignLecturers);

/**
 * @swagger
 * /course/admin/{slug}/lecturers/{lecturerId}:
 *   delete:
 *     summary: Remove a lecturer from a course (Admin only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: lecturerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lecturer removed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.delete("/admin/:slug/lecturers/:lecturerId", verifyAdmin, courseController.removeLecturer);

// ======================= HYBRID ROUTES (Both Lecturer & Admin) =======================

/**
 * @swagger
 * /course/{slug}:
 *   delete:
 *     summary: Delete/Archive a course (Lecturer/Admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course archived
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this course
 *       404:
 *         description: Course not found
 */
router.delete("/:slug", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), courseController.deleteCourse);

// ======================= COURSE RATING ROUTES =======================

/**
 * @swagger
 * /course/{slug}/rating:
 *   get:
 *     summary: Get course rating stats
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                     totalRatings:
 *                       type: integer
 *                     userRating:
 *                       type: integer
 *                     hasRated:
 *                       type: boolean
 */
router.get("/:slug/rating", checkAuth, courseController.getCourseRating);

/**
 * @swagger
 * /course/{slug}/rating:
 *   post:
 *     summary: Rate a course (one-time only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Course rated successfully
 *       400:
 *         description: Invalid rating
 *       403:
 *         description: Not enrolled in course
 *       409:
 *         description: Already rated this course
 */
router.post("/:slug/rating", verifyUser, courseController.rateCourse);

module.exports = router;