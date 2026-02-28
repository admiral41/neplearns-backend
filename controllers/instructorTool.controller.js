const InstructorTool = require('../models/instructorTool.model');
const httpStatus = require('http-status');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= GET ALL TOOLS =======================
exports.getTools = async (req, res) => {
  try {
    const tools = await InstructorTool.find({
      instructor: req.user._id,
      isDeleted: false
    }).sort({ createdAt: -1 });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: tools,
      msg: 'Tools retrieved successfully.'
    });
  } catch (err) {
    console.error('Get tools error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get tools.',
      err: err.message
    });
  }
};

// ======================= CREATE TOOL =======================
exports.createTool = async (req, res) => {
  try {
    const { name, description, link } = req.body;

    if (!name) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Tool name is required.'
      });
    }

    const tool = await InstructorTool.create({
      name,
      description,
      link,
      instructor: req.user._id
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      data: tool,
      msg: 'Tool created successfully.'
    });
  } catch (err) {
    console.error('Create tool error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to create tool.',
      err: err.message
    });
  }
};

// ======================= UPDATE TOOL =======================
exports.updateTool = async (req, res) => {
  try {
    const { name, description, link } = req.body;

    const tool = await InstructorTool.findOne({
      _id: req.params.id,
      instructor: req.user._id,
      isDeleted: false
    });

    if (!tool) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Tool not found.'
      });
    }

    if (name !== undefined) tool.name = name;
    if (description !== undefined) tool.description = description;
    if (link !== undefined) tool.link = link;

    await tool.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: tool,
      msg: 'Tool updated successfully.'
    });
  } catch (err) {
    console.error('Update tool error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to update tool.',
      err: err.message
    });
  }
};

// ======================= DELETE TOOL (SOFT) =======================
exports.deleteTool = async (req, res) => {
  try {
    const tool = await InstructorTool.findOne({
      _id: req.params.id,
      instructor: req.user._id,
      isDeleted: false
    });

    if (!tool) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Tool not found.'
      });
    }

    tool.isDeleted = true;
    tool.deletedAt = new Date();
    await tool.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Tool deleted successfully.'
    });
  } catch (err) {
    console.error('Delete tool error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to delete tool.',
      err: err.message
    });
  }
};
