const User = require("../models/user.model");
const Lecturer = require("../models/lecturer.model");
const Course = require("../models/course.model");
const Category = require("../models/category.js");
const Enrollment = require("../models/enrollment.model");
const httpStatus = require("http-status");
const { responseHandler } = require("../helpers/index");
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

/**
 * Get comprehensive analytics data for admin dashboard
 * Supports date range filtering: 7days, 30days, 3months, 6months, 1year
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { range = "6months" } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate, monthsToShow;

    switch (range) {
      case "7days":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        monthsToShow = 1;
        break;
      case "30days":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        monthsToShow = 1;
        break;
      case "3months":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 3);
        monthsToShow = 3;
        break;
      case "6months":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
        monthsToShow = 6;
        break;
      case "1year":
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        monthsToShow = 12;
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
        monthsToShow = 6;
    }

    // Previous period for comparison
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - monthsToShow);

    // Run all queries in parallel
    const [
      userGrowthData,
      enrollmentData,
      revenueData,
      topCourses,
      topInstructors,
      categoryStats,
      summaryStats,
      previousPeriodStats,
    ] = await Promise.all([
      getUserGrowthData(startDate, now, monthsToShow),
      getEnrollmentData(startDate, now, monthsToShow),
      getRevenueData(startDate, now, monthsToShow),
      getTopCourses(5),
      getTopInstructors(5),
      getCategoryStats(),
      getSummaryStats(startDate, now),
      getSummaryStats(previousPeriodStart, startDate),
    ]);

    // Calculate percentage changes
    const changes = calculatePercentageChanges(summaryStats, previousPeriodStats);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        userGrowth: userGrowthData,
        enrollments: enrollmentData,
        revenue: revenueData,
        topCourses,
        topInstructors,
        categoryStats,
        summary: {
          ...summaryStats,
          changes,
        },
      },
      msg: "Analytics data retrieved successfully.",
    });
  } catch (err) {
    console.error("Get analytics error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get analytics data.",
      err: err.message,
    });
  }
};

/**
 * Get user growth data grouped by month
 */
async function getUserGrowthData(startDate, endDate, monthsToShow) {
  const months = generateMonthsArray(startDate, endDate, monthsToShow);

  // Get students grouped by month
  const studentsByMonth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        roles: { $in: ["LEARNER"], $nin: ["LECTURER", "ADMIN", "SUPERADMIN"] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Get instructors grouped by month
  const instructorsByMonth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        roles: { $in: ["LECTURER"] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Map to months array with cumulative counts
  let cumulativeStudents = await User.countDocuments({
    createdAt: { $lt: startDate },
    roles: { $in: ["LEARNER"], $nin: ["LECTURER", "ADMIN", "SUPERADMIN"] },
  });

  let cumulativeInstructors = await User.countDocuments({
    createdAt: { $lt: startDate },
    roles: { $in: ["LECTURER"] },
  });

  return months.map((month) => {
    const studentData = studentsByMonth.find(
      (s) => s._id.year === month.year && s._id.month === month.monthNum
    );
    const instructorData = instructorsByMonth.find(
      (i) => i._id.year === month.year && i._id.month === month.monthNum
    );

    cumulativeStudents += studentData?.count || 0;
    cumulativeInstructors += instructorData?.count || 0;

    return {
      month: month.label,
      students: cumulativeStudents,
      instructors: cumulativeInstructors,
      newStudents: studentData?.count || 0,
      newInstructors: instructorData?.count || 0,
    };
  });
}

/**
 * Get enrollment data grouped by month
 */
async function getEnrollmentData(startDate, endDate, monthsToShow) {
  const months = generateMonthsArray(startDate, endDate, monthsToShow);

  const enrollmentsByMonth = await Enrollment.aggregate([
    {
      $match: {
        enrolledAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$enrolledAt" },
          month: { $month: "$enrolledAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  return months.map((month) => {
    const data = enrollmentsByMonth.find(
      (e) => e._id.year === month.year && e._id.month === month.monthNum
    );
    return {
      month: month.label,
      enrollments: data?.count || 0,
    };
  });
}

/**
 * Get revenue data grouped by month
 */
async function getRevenueData(startDate, endDate, monthsToShow) {
  const months = generateMonthsArray(startDate, endDate, monthsToShow);

  const revenueByMonth = await Enrollment.aggregate([
    {
      $match: {
        enrolledAt: { $gte: startDate, $lte: endDate },
        paymentStatus: "completed",
        paymentMethod: { $ne: "free" },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$enrolledAt" },
          month: { $month: "$enrolledAt" },
        },
        revenue: { $sum: "$paymentAmount" },
      },
    },
  ]);

  return months.map((month) => {
    const data = revenueByMonth.find(
      (r) => r._id.year === month.year && r._id.month === month.monthNum
    );
    return {
      month: month.label,
      revenue: data?.revenue || 0,
    };
  });
}

/**
 * Get top performing courses
 */
async function getTopCourses(limit = 5) {
  // Aggregate enrollments by course
  const courseEnrollments = await Enrollment.aggregate([
    {
      $match: {
        paymentStatus: "completed",
      },
    },
    {
      $group: {
        _id: "$course",
        students: { $sum: 1 },
        revenue: { $sum: "$paymentAmount" },
      },
    },
    {
      $sort: { students: -1 },
    },
    {
      $limit: limit,
    },
  ]);

  // Get course details
  const courseIds = courseEnrollments.map((c) => c._id);
  const courses = await Course.find({ _id: { $in: courseIds } })
    .select("courseTitle rating")
    .lean();

  return courseEnrollments.map((enrollment, index) => {
    const course = courses.find(
      (c) => c._id.toString() === enrollment._id?.toString()
    );
    return {
      id: index + 1,
      courseId: enrollment._id,
      title: course?.courseTitle || "Unknown Course",
      students: enrollment.students,
      revenue: enrollment.revenue,
      rating: course?.rating || 0,
    };
  });
}

/**
 * Get top instructors by student count and earnings
 */
async function getTopInstructors(limit = 5) {
  // Get all lecturers with their user info
  const lecturers = await Lecturer.find({ requestStatus: "approved" })
    .populate("user", "firstname lastname")
    .lean();

  if (lecturers.length === 0) {
    return [];
  }

  // Get courses for each lecturer
  const instructorStats = await Promise.all(
    lecturers.map(async (lecturer) => {
      // Find courses where this lecturer is assigned
      const courses = await Course.find({
        lecturers: lecturer._id,
        status: "approved",
      })
        .select("_id")
        .lean();

      const courseIds = courses.map((c) => c._id);

      // Get enrollment stats for these courses
      const enrollmentStats = await Enrollment.aggregate([
        {
          $match: {
            course: { $in: courseIds },
            paymentStatus: "completed",
          },
        },
        {
          $group: {
            _id: null,
            students: { $sum: 1 },
            earnings: { $sum: "$paymentAmount" },
          },
        },
      ]);

      const stats = enrollmentStats[0] || { students: 0, earnings: 0 };

      return {
        lecturerId: lecturer._id,
        userId: lecturer.user?._id,
        name: lecturer.user
          ? `${lecturer.user.firstname} ${lecturer.user.lastname}`
          : "Unknown Instructor",
        courses: courses.length,
        students: stats.students,
        earnings: stats.earnings,
        rating: 0, // Would need review system to calculate
      };
    })
  );

  // Sort by students and take top N
  return instructorStats
    .sort((a, b) => b.students - a.students)
    .slice(0, limit)
    .map((instructor, index) => ({
      id: index + 1,
      ...instructor,
    }));
}

/**
 * Get category performance stats
 */
async function getCategoryStats() {
  const categories = await Category.find({ isActive: true }).lean();

  const categoryStats = await Promise.all(
    categories.map(async (category) => {
      // Get courses in this category
      const courses = await Course.find({
        category: category._id,
        status: "approved",
      })
        .select("_id")
        .lean();

      const courseIds = courses.map((c) => c._id);

      // Get enrollment stats for these courses
      const enrollmentStats = await Enrollment.aggregate([
        {
          $match: {
            course: { $in: courseIds },
            paymentStatus: "completed",
          },
        },
        {
          $group: {
            _id: null,
            students: { $sum: 1 },
            revenue: { $sum: "$paymentAmount" },
          },
        },
      ]);

      const stats = enrollmentStats[0] || { students: 0, revenue: 0 };

      return {
        name: category.categoryName,
        courses: courses.length,
        students: stats.students,
        revenue: stats.revenue,
      };
    })
  );

  // Sort by revenue descending
  return categoryStats.sort((a, b) => b.revenue - a.revenue);
}

/**
 * Get summary statistics for a period
 */
async function getSummaryStats(startDate, endDate) {
  const [totalStudents, totalInstructors, totalEnrollments, totalRevenue] =
    await Promise.all([
      User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        roles: { $in: ["LEARNER"], $nin: ["LECTURER", "ADMIN", "SUPERADMIN"] },
      }),
      User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        roles: { $in: ["LECTURER"] },
      }),
      Enrollment.countDocuments({
        enrolledAt: { $gte: startDate, $lte: endDate },
      }),
      Enrollment.aggregate([
        {
          $match: {
            enrolledAt: { $gte: startDate, $lte: endDate },
            paymentStatus: "completed",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$paymentAmount" },
          },
        },
      ]),
    ]);

  // Also get cumulative totals (all time up to endDate)
  const [
    cumulativeStudents,
    cumulativeInstructors,
    cumulativeEnrollments,
    cumulativeRevenue,
  ] = await Promise.all([
    User.countDocuments({
      createdAt: { $lte: endDate },
      roles: { $in: ["LEARNER"], $nin: ["LECTURER", "ADMIN", "SUPERADMIN"] },
    }),
    User.countDocuments({
      createdAt: { $lte: endDate },
      roles: { $in: ["LECTURER"] },
    }),
    Enrollment.countDocuments({
      enrolledAt: { $lte: endDate },
    }),
    Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $lte: endDate },
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$paymentAmount" },
        },
      },
    ]),
  ]);

  return {
    periodStudents: totalStudents,
    periodInstructors: totalInstructors,
    periodEnrollments: totalEnrollments,
    periodRevenue: totalRevenue[0]?.total || 0,
    totalStudents: cumulativeStudents,
    totalInstructors: cumulativeInstructors,
    totalEnrollments: cumulativeEnrollments,
    totalRevenue: cumulativeRevenue[0]?.total || 0,
  };
}

/**
 * Calculate percentage changes between periods
 */
function calculatePercentageChanges(current, previous) {
  const calculateChange = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    students: calculateChange(current.periodStudents, previous.periodStudents),
    instructors: calculateChange(
      current.periodInstructors,
      previous.periodInstructors
    ),
    enrollments: calculateChange(
      current.periodEnrollments,
      previous.periodEnrollments
    ),
    revenue: calculateChange(current.periodRevenue, previous.periodRevenue),
  };
}

/**
 * Generate array of months between two dates
 */
function generateMonthsArray(startDate, endDate, monthsToShow) {
  const months = [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const start = new Date(startDate);
  start.setDate(1); // Start from first day of month

  for (let i = 0; i < monthsToShow; i++) {
    const date = new Date(start);
    date.setMonth(date.getMonth() + i);

    months.push({
      year: date.getFullYear(),
      monthNum: date.getMonth() + 1, // MongoDB months are 1-indexed
      label: monthNames[date.getMonth()],
    });
  }

  return months;
}
