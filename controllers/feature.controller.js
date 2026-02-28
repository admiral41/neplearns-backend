const Feature = require('../models/feature.model');
const Settings = require('../models/settings.model');
const httpStatus = require('http-status');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= PUBLIC ROUTES =======================

/**
 * Get all active features for landing page (public)
 */
exports.getPublicFeatures = async (req, res) => {
  try {
    const features = await Feature.find({ isActive: true })
      .select('icon title description displayOrder')
      .sort({ displayOrder: 1 })
      .lean();

    // Get section content from settings
    const settings = await Settings.getSettings();
    const sectionContent = settings.sections?.whyChooseUs || {
      title: 'Why Choose {platformName}?',
      subtitle: 'We provide the best learning experience for SEE and +2 students across Nepal'
    };

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        section: sectionContent,
        features
      },
      msg: 'Features retrieved successfully.'
    });
  } catch (err) {
    console.error('Get public features error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get features.',
      err: err.message
    });
  }
};

// ======================= ADMIN ROUTES =======================

/**
 * Get all features (admin)
 */
exports.getAllFeatures = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const features = await Feature.find(query)
      .populate('createdBy', 'firstname lastname')
      .sort({ displayOrder: 1 })
      .lean();

    // Get section content from settings
    const settings = await Settings.getSettings();
    const sectionContent = settings.sections?.whyChooseUs || {
      title: 'Why Choose {platformName}?',
      subtitle: 'We provide the best learning experience for SEE and +2 students across Nepal'
    };

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        section: sectionContent,
        features
      },
      msg: 'Features retrieved successfully.'
    });
  } catch (err) {
    console.error('Get all features error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get features.',
      err: err.message
    });
  }
};

/**
 * Get feature by ID (admin)
 */
exports.getFeatureById = async (req, res) => {
  try {
    const { id } = req.params;

    const feature = await Feature.findById(id)
      .populate('createdBy', 'firstname lastname');

    if (!feature) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Feature not found.'
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: feature,
      msg: 'Feature retrieved successfully.'
    });
  } catch (err) {
    console.error('Get feature by ID error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get feature.',
      err: err.message
    });
  }
};

/**
 * Create feature (admin)
 */
exports.createFeature = async (req, res) => {
  try {
    const { icon, title, description, displayOrder } = req.body;

    if (!title || !description) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Title and description are required.'
      });
    }

    // Get max displayOrder if not provided
    let order = displayOrder;
    if (order === undefined) {
      const maxOrder = await Feature.findOne().sort({ displayOrder: -1 }).select('displayOrder');
      order = (maxOrder?.displayOrder || 0) + 1;
    }

    const feature = await Feature.create({
      icon: icon || 'Star',
      title,
      description,
      displayOrder: order,
      createdBy: req.user._id
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      data: feature,
      msg: 'Feature created successfully.'
    });
  } catch (err) {
    console.error('Create feature error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to create feature.',
      err: err.message
    });
  }
};

/**
 * Update feature (admin)
 */
exports.updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { icon, title, description, displayOrder, isActive } = req.body;

    const feature = await Feature.findById(id);

    if (!feature) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Feature not found.'
      });
    }

    if (icon !== undefined) feature.icon = icon;
    if (title !== undefined) feature.title = title;
    if (description !== undefined) feature.description = description;
    if (displayOrder !== undefined) feature.displayOrder = displayOrder;
    if (isActive !== undefined) feature.isActive = isActive;

    await feature.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: feature,
      msg: 'Feature updated successfully.'
    });
  } catch (err) {
    console.error('Update feature error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to update feature.',
      err: err.message
    });
  }
};

/**
 * Toggle feature status (admin)
 */
exports.toggleFeatureStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const feature = await Feature.findById(id);

    if (!feature) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Feature not found.'
      });
    }

    feature.isActive = !feature.isActive;
    await feature.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: feature,
      msg: `Feature ${feature.isActive ? 'activated' : 'deactivated'} successfully.`
    });
  } catch (err) {
    console.error('Toggle feature status error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to toggle feature status.',
      err: err.message
    });
  }
};

/**
 * Delete feature (admin)
 */
exports.deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;

    const feature = await Feature.findById(id);

    if (!feature) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Feature not found.'
      });
    }

    await Feature.findByIdAndDelete(id);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Feature deleted successfully.'
    });
  } catch (err) {
    console.error('Delete feature error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to delete feature.',
      err: err.message
    });
  }
};

/**
 * Reorder features (admin)
 */
exports.reorderFeatures = async (req, res) => {
  try {
    const { featureIds } = req.body;

    if (!Array.isArray(featureIds) || featureIds.length === 0) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Feature IDs array is required.'
      });
    }

    // Update display order for each feature
    const updates = featureIds.map((id, index) =>
      Feature.findByIdAndUpdate(id, { displayOrder: index })
    );

    await Promise.all(updates);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Features reordered successfully.'
    });
  } catch (err) {
    console.error('Reorder features error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to reorder features.',
      err: err.message
    });
  }
};

/**
 * Update section content (admin)
 */
exports.updateSectionContent = async (req, res) => {
  try {
    const { title, subtitle } = req.body;

    const settings = await Settings.getSettings();

    if (!settings.sections) {
      settings.sections = {};
    }

    settings.sections.whyChooseUs = {
      title: title || settings.sections.whyChooseUs?.title || 'Why Choose {platformName}?',
      subtitle: subtitle || settings.sections.whyChooseUs?.subtitle || 'We provide the best learning experience for SEE and +2 students across Nepal'
    };

    await settings.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: settings.sections.whyChooseUs,
      msg: 'Section content updated successfully.'
    });
  } catch (err) {
    console.error('Update section content error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to update section content.',
      err: err.message
    });
  }
};
