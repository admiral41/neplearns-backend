const httpStatus = require('http-status');
const Resource = require('../models/resource');
const Lesson = require('../models/lessons');
const Course = require('../models/course.model');
const Week = require('../models/weeks');
const { responseHandler } = require('../helpers/index');
const fs = require('fs');
const path = require('path');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= CREATE RESOURCE =======================
exports.createResource = async (req, res) => {
    try {
        const { title, type, url, lesson: lessonId } = req.body;
        const createdBy = req.user._id;

        // Check if lesson exists
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return sendErrorResponse({
                res,
                status: httpStatus.NOT_FOUND,
                msg: "Lesson not found"
            });
        }

        // Check permissions: Must be Lecturer of the course or Admin/SuperAdmin
        const week = await Week.findById(lesson.week);
        if (!week) {
            return sendErrorResponse({
                res,
                status: httpStatus.NOT_FOUND,
                msg: "Week associated with lesson not found"
            });
        }

        const course = await Course.findById(week.course);
        if (!course) {
            return sendErrorResponse({
                res,
                status: httpStatus.NOT_FOUND,
                msg: "Course associated with lesson not found"
            });
        }

        const canModify = await course.canUserEdit(req.user._id, req.user.roles);

        if (!canModify) {
            return sendErrorResponse({
                res,
                status: httpStatus.FORBIDDEN,
                msg: "You don't have permission to add resources to this lesson"
            });
        }

        let resourceData = {
            title,
            type,
            lesson: lessonId,
            createdBy
        };

        if (type === 'FILE') {
            if (!req.file) {
                return sendErrorResponse({
                    res,
                    status: httpStatus.BAD_REQUEST,
                    msg: "File is required for FILE type resource"
                });
            }
            resourceData.url = req.file.path;
            resourceData.originalName = req.file.originalname;
            resourceData.fileSize = req.file.size;
            resourceData.fileType = path.extname(req.file.originalname).substring(1);
        } else {
            if (!url) {
                return sendErrorResponse({
                    res,
                    status: httpStatus.BAD_REQUEST,
                    msg: "URL is required for LINK type resource"
                });
            }
            resourceData.url = url;
            resourceData.fileType = 'link';
        }

        const resource = await Resource.create(resourceData);

        return sendSuccessResponse({
            res,
            status: httpStatus.CREATED,
            msg: "Resource created successfully",
            data: resource
        });
    } catch (error) {
        console.error('Create resource error:', error);
        return sendErrorResponse({
            res,
            status: httpStatus.INTERNAL_SERVER_ERROR,
            msg: "Failed to create resource"
        });
    }
};

// ======================= GET RESOURCES BY LESSON =======================
exports.getResourcesByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const resources = await Resource.find({ lesson: lessonId, isActive: true })
            .populate('createdBy', 'firstname lastname')
            .sort({ createdAt: -1 });

        return sendSuccessResponse({
            res,
            status: httpStatus.OK,
            msg: "Resources retrieved successfully",
            data: resources
        });
    } catch (error) {
        console.error('Get resources error:', error);
        return sendErrorResponse({
            res,
            status: httpStatus.INTERNAL_SERVER_ERROR,
            msg: "Failed to get resources"
        });
    }
};

// ======================= UPDATE RESOURCE =======================
exports.updateResource = async (req, res) => {
    try {
        const { resourceId } = req.params;
        const { title, isActive } = req.body;

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return sendErrorResponse({
                res,
                status: httpStatus.NOT_FOUND,
                msg: "Resource not found"
            });
        }

        // Permission check
        const lesson = await Lesson.findById(resource.lesson);
        if (!lesson) {
            return sendErrorResponse({ res, status: httpStatus.NOT_FOUND, msg: "Lesson not found" });
        }
        const week = await Week.findById(lesson.week);
        if (!week) {
            return sendErrorResponse({ res, status: httpStatus.NOT_FOUND, msg: "Week not found" });
        }
        const course = await Course.findById(week.course);
        if (!course) {
            return sendErrorResponse({ res, status: httpStatus.NOT_FOUND, msg: "Course not found" });
        }
        const canModify = await course.canUserEdit(req.user._id, req.user.roles);

        if (!canModify) {
            return sendErrorResponse({
                res,
                status: httpStatus.FORBIDDEN,
                msg: "You don't have permission to update this resource"
            });
        }

        const updatedResource = await Resource.findByIdAndUpdate(
            resourceId,
            {
                title: title || resource.title,
                isActive: isActive !== undefined ? isActive : resource.isActive
            },
            { new: true }
        );

        return sendSuccessResponse({
            res,
            status: httpStatus.OK,
            msg: "Resource updated successfully",
            data: updatedResource
        });
    } catch (error) {
        console.error('Update resource error:', error);
        return sendErrorResponse({
            res,
            status: httpStatus.INTERNAL_SERVER_ERROR,
            msg: "Failed to update resource"
        });
    }
};

// ======================= DELETE RESOURCE =======================
exports.deleteResource = async (req, res) => {
    try {
        const { resourceId } = req.params;

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return sendErrorResponse({
                res,
                status: httpStatus.NOT_FOUND,
                msg: "Resource not found"
            });
        }

        // Permission check
        const lesson = await Lesson.findById(resource.lesson);
        if (!lesson) {
            return sendErrorResponse({ res, status: httpStatus.NOT_FOUND, msg: "Lesson not found" });
        }
        const week = await Week.findById(lesson.week);
        if (!week) {
            return sendErrorResponse({ res, status: httpStatus.NOT_FOUND, msg: "Week not found" });
        }
        const course = await Course.findById(week.course);
        if (!course) {
            return sendErrorResponse({ res, status: httpStatus.NOT_FOUND, msg: "Course not found" });
        }
        const canModify = await course.canUserEdit(req.user._id, req.user.roles);

        if (!canModify) {
            return sendErrorResponse({
                res,
                status: httpStatus.FORBIDDEN,
                msg: "You don't have permission to delete this resource"
            });
        }

        // Delete file if it's a FILE type
        if (resource.type === 'FILE') {
            try {
                if (fs.existsSync(resource.url)) {
                    fs.unlinkSync(resource.url);
                }
            } catch (err) {
                console.error('Error deleting file:', err);
            }
        }

        await Resource.findByIdAndDelete(resourceId);

        return sendSuccessResponse({
            res,
            status: httpStatus.OK,
            msg: "Resource deleted successfully"
        });
    } catch (error) {
        console.error('Delete resource error:', error);
        return sendErrorResponse({
            res,
            status: httpStatus.INTERNAL_SERVER_ERROR,
            msg: "Failed to delete resource"
        });
    }
};
