const mongoose = require('mongoose');
const TutoringPayment = require('../models/tutoringPayment.model');
const TutoringEnrollment = require('../models/tutoringEnrollment.model');
const { responseHandler } = require('../helpers/index');
const httpStatus = require('http-status');

const { sendSuccessResponse, sendErrorResponse } = responseHandler;

// Default platform fee percentage (used for backward compatibility)
const DEFAULT_PLATFORM_FEE_PERCENTAGE = 15;

/**
 * Get earnings summary (Instructor endpoint)
 * GET /tutoring-earnings/summary
 * Returns: { currentMonth, total, lastUpdated }
 * Note: Only net amounts are returned to instructors (fee details hidden)
 */
exports.getSummary = async (req, res) => {
  try {
    const instructorId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate with per-enrollment fee for current month
    const currentMonthResult = await TutoringPayment.aggregate([
      {
        $lookup: {
          from: 'tutoringenrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollmentData',
        },
      },
      { $unwind: '$enrollmentData' },
      {
        $match: {
          'enrollmentData.instructor': instructorId,
          status: 'approved',
          verifiedAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalNet: {
            $sum: {
              $multiply: [
                '$amount',
                {
                  $subtract: [
                    1,
                    {
                      $divide: [
                        { $ifNull: ['$enrollmentData.platformFeePercentage', DEFAULT_PLATFORM_FEE_PERCENTAGE] },
                        100,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    ]);

    // Aggregate with per-enrollment fee for all time
    const totalResult = await TutoringPayment.aggregate([
      {
        $lookup: {
          from: 'tutoringenrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollmentData',
        },
      },
      { $unwind: '$enrollmentData' },
      {
        $match: {
          'enrollmentData.instructor': instructorId,
          status: 'approved',
        },
      },
      {
        $group: {
          _id: null,
          totalNet: {
            $sum: {
              $multiply: [
                '$amount',
                {
                  $subtract: [
                    1,
                    {
                      $divide: [
                        { $ifNull: ['$enrollmentData.platformFeePercentage', DEFAULT_PLATFORM_FEE_PERCENTAGE] },
                        100,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    ]);

    // Get last payment date for lastUpdated
    const enrollments = await TutoringEnrollment.find({
      instructor: instructorId,
    }).select('_id');
    const enrollmentIds = enrollments.map((e) => e._id);

    const lastPayment = await TutoringPayment.findOne({
      enrollment: { $in: enrollmentIds },
      status: 'approved',
    })
      .sort({ verifiedAt: -1 })
      .select('verifiedAt');

    const currentMonthNet = Math.round(currentMonthResult[0]?.totalNet || 0);
    const totalNet = Math.round(totalResult[0]?.totalNet || 0);

    // Return only net amounts to instructors (fee details hidden)
    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Earnings summary retrieved',
      data: {
        currentMonth: { netAmount: currentMonthNet },
        total: { netAmount: totalNet },
        lastUpdated: lastPayment?.verifiedAt || null,
      },
    });
  } catch (error) {
    console.error('Get earnings summary error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to retrieve earnings summary',
    });
  }
};

/**
 * Get earnings breakdown by student (Instructor endpoint)
 * GET /tutoring-earnings/by-student
 * Returns: Array of { student: { _id, name }, subject, paymentCount, netAmount }
 * Note: Only net amounts are returned to instructors (fee details hidden)
 */
exports.getBreakdownByStudent = async (req, res) => {
  try {
    const instructorId = new mongoose.Types.ObjectId(req.user._id);

    const earnings = await TutoringPayment.aggregate([
      // Lookup enrollment data
      {
        $lookup: {
          from: 'tutoringenrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollmentData',
        },
      },
      { $unwind: '$enrollmentData' },
      // Filter by instructor and approved status
      {
        $match: {
          'enrollmentData.instructor': instructorId,
          status: 'approved',
        },
      },
      // Lookup student info
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      // Lookup subject info
      {
        $lookup: {
          from: 'tutoringsubjects',
          localField: 'enrollmentData.subject',
          foreignField: '_id',
          as: 'subjectInfo',
        },
      },
      { $unwind: '$subjectInfo' },
      // Calculate net amount per payment using per-enrollment fee
      {
        $addFields: {
          netAmount: {
            $multiply: [
              '$amount',
              {
                $subtract: [
                  1,
                  {
                    $divide: [
                      { $ifNull: ['$enrollmentData.platformFeePercentage', DEFAULT_PLATFORM_FEE_PERCENTAGE] },
                      100,
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      // Group by student and subject
      {
        $group: {
          _id: {
            student: '$student',
            subject: '$enrollmentData.subject',
          },
          studentName: {
            $first: {
              $concat: ['$studentInfo.firstname', ' ', '$studentInfo.lastname'],
            },
          },
          subjectName: { $first: '$subjectInfo.name' },
          totalNetAmount: { $sum: '$netAmount' },
          paymentCount: { $sum: 1 },
        },
      },
      // Project final shape - only net amount, no gross/fee details
      {
        $project: {
          _id: 0,
          student: {
            _id: '$_id.student',
            name: '$studentName',
          },
          subject: {
            _id: '$_id.subject',
            name: '$subjectName',
          },
          netAmount: { $round: ['$totalNetAmount', 0] },
          paymentCount: 1,
        },
      },
      // Sort by net amount descending
      { $sort: { netAmount: -1 } },
    ]);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Earnings breakdown by student retrieved',
      data: {
        earnings,
        count: earnings.length,
      },
    });
  } catch (error) {
    console.error('Get earnings by student error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to retrieve earnings breakdown',
    });
  }
};

/**
 * Get monthly earnings breakdown (Instructor endpoint)
 * GET /tutoring-earnings/monthly?year=2026
 * Returns: Array of { month, year, paymentCount, netAmount }
 * Note: Only net amounts are returned to instructors (fee details hidden)
 */
exports.getMonthlyBreakdown = async (req, res) => {
  try {
    const instructorId = new mongoose.Types.ObjectId(req.user._id);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    // Aggregate with per-enrollment fee
    const earnings = await TutoringPayment.aggregate([
      {
        $lookup: {
          from: 'tutoringenrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollmentData',
        },
      },
      { $unwind: '$enrollmentData' },
      {
        $match: {
          'enrollmentData.instructor': instructorId,
          status: 'approved',
          verifiedAt: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      // Calculate net amount per payment using per-enrollment fee
      {
        $addFields: {
          netAmount: {
            $multiply: [
              '$amount',
              {
                $subtract: [
                  1,
                  {
                    $divide: [
                      { $ifNull: ['$enrollmentData.platformFeePercentage', DEFAULT_PLATFORM_FEE_PERCENTAGE] },
                      100,
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$verifiedAt' },
            year: { $year: '$verifiedAt' },
          },
          totalNetAmount: { $sum: '$netAmount' },
          paymentCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          netAmount: { $round: ['$totalNetAmount', 0] },
          paymentCount: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Fill in missing months with zero values - only net amount, no gross/fee details
    const filledEarnings = [];
    for (let month = 1; month <= 12; month++) {
      const existing = earnings.find((e) => e.month === month);
      filledEarnings.push({
        month,
        year,
        paymentCount: existing?.paymentCount || 0,
        netAmount: existing?.netAmount || 0,
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Monthly earnings retrieved',
      data: {
        earnings: filledEarnings,
        year,
      },
    });
  } catch (error) {
    console.error('Get monthly earnings error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to retrieve monthly earnings',
    });
  }
};
