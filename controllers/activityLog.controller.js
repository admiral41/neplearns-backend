const ActivityLog = require('../models/activityLog.model');
const httpStatus = require('http-status');
const { sendSuccessResponse, sendErrorResponse } = require('../helpers/responseHandler');

/**
 * Get activity logs with filtering and pagination
 * @route GET /activity-logs
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      action,
      userId,
      targetType,
      targetId,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    // Apply filters
    if (category) query.category = category;
    if (action) query.action = action;
    if (userId) query.user = userId;
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search in description, userName, userEmail
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { targetName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'firstname lastname email userImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    return sendSuccessResponse({
      res,
      status: 200,
      msg: 'Activity logs fetched successfully',
      data: logs,
      totalData: total,
      totalPage: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return sendErrorResponse({
      res,
      status: 500,
      msg: 'Failed to fetch activity logs',
      err: error.message,
    });
  }
};

/**
 * Get activity log by ID
 * @route GET /activity-logs/:id
 */
exports.getActivityLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id)
      .populate('user', 'firstname lastname email userImage');

    if (!log) {
      return sendErrorResponse({
        res,
        status: 404,
        msg: 'Activity log not found',
      });
    }

    return sendSuccessResponse({
      res,
      status: 200,
      msg: 'Activity log fetched successfully',
      data: log,
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return sendErrorResponse({
      res,
      status: 500,
      msg: 'Failed to fetch activity log',
      err: error.message,
    });
  }
};

/**
 * Get activity logs for a specific user
 * @route GET /activity-logs/user/:userId
 */
exports.getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, category } = req.query;

    const query = { user: userId };
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    return sendSuccessResponse({
      res,
      status: 200,
      msg: 'User activity logs fetched successfully',
      data: logs,
      totalData: total,
      totalPage: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    return sendErrorResponse({
      res,
      status: 500,
      msg: 'Failed to fetch user activity logs',
      err: error.message,
    });
  }
};

/**
 * Get activity statistics/summary
 * @route GET /activity-logs/stats
 */
exports.getActivityStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get counts by category
    const categoryStats = await ActivityLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get counts by action
    const actionStats = await ActivityLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get recent activity (last 7 days by day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivity = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get total counts
    const totalLogs = await ActivityLog.countDocuments(dateFilter);
    const successCount = await ActivityLog.countDocuments({ ...dateFilter, status: 'SUCCESS' });
    const failedCount = await ActivityLog.countDocuments({ ...dateFilter, status: 'FAILED' });

    return sendSuccessResponse({
      res,
      status: 200,
      msg: 'Activity statistics fetched successfully',
      data: {
        total: totalLogs,
        successCount,
        failedCount,
        categoryStats,
        actionStats,
        dailyActivity,
      },
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return sendErrorResponse({
      res,
      status: 500,
      msg: 'Failed to fetch activity statistics',
      err: error.message,
    });
  }
};

/**
 * Delete old activity logs (cleanup)
 * @route DELETE /activity-logs/cleanup
 */
exports.cleanupOldLogs = async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    // Log the cleanup action
    await ActivityLog.log({
      user: req.user,
      action: 'OTHER',
      category: 'ADMIN',
      description: `Cleaned up ${result.deletedCount} activity logs older than ${daysToKeep} days`,
      status: 'SUCCESS',
    });

    return sendSuccessResponse({
      res,
      status: 200,
      msg: `Deleted ${result.deletedCount} old activity logs`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error('Error cleaning up activity logs:', error);
    return sendErrorResponse({
      res,
      status: 500,
      msg: 'Failed to cleanup activity logs',
      err: error.message,
    });
  }
};

/**
 * Export activity logs as CSV
 * @route GET /activity-logs/export
 */
exports.exportActivityLogs = async (req, res) => {
  try {
    const { startDate, endDate, category, action } = req.query;

    const query = {};
    if (category) query.category = category;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .populate('user', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    // Create CSV content
    const headers = ['Date', 'Time', 'User', 'Email', 'Role', 'Action', 'Category', 'Description', 'Target', 'Status', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleDateString(),
      new Date(log.createdAt).toLocaleTimeString(),
      log.userName || 'N/A',
      log.userEmail || 'N/A',
      log.userRole || 'N/A',
      log.action,
      log.category,
      `"${(log.description || '').replace(/"/g, '""')}"`,
      log.targetName || 'N/A',
      log.status,
      log.ipAddress || 'N/A',
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    return sendErrorResponse({
      res,
      status: 500,
      msg: 'Failed to export activity logs',
      err: error.message,
    });
  }
};
