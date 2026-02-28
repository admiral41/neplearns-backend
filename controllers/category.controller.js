const httpStatus = require('http-status');
const Category = require('../models/category');
const Course = require('../models/course.model');
const { responseHandler } = require('../helpers/index');
const { parseFilters, sendErrorResponse, sendQueryResponse, sendSuccessResponse } = responseHandler;
const upload = require('../middlewares/multer');
const multer = require('multer');

const uploadFile = upload.single('image');

// ======================= CREATE CATEGORY =======================
exports.createCategory = async (req, res) => {
  try {
    uploadFile(req, res, async err => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendErrorResponse({ 
            res, 
            status: httpStatus.BAD_REQUEST, 
            msg: 'Image upload error.' 
          });
        }
      } else if (err) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.INTERNAL_SERVER_ERROR, 
          msg: 'Failed to upload image.' 
        });
      }

      const { 
        categoryName, 
        categoryShortDesc, 
        categoryDesc,
        icon,
        color 
      } = req.body;

      // Check admin privileges for category creation
      if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.FORBIDDEN, 
          msg: 'Admin privileges required to create categories.' 
        });
      }

      // Check if category already exists (categoryName is unique)
      const existingCategory = await Category.findOne({ 
        categoryName
      });

      if (existingCategory) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.CONFLICT, 
          msg: 'Category name already exists.' 
        });
      }

      // Get order number (last order + 1)
      const lastCategory = await Category.findOne()
        .sort({ order: -1 })
        .select('order');

      const order = lastCategory ? lastCategory.order + 1 : 0;

      // Create category
      const category = await Category.create({
        categoryName,
        categoryShortDesc,
        categoryDesc,
        image: req.file ? req.file.path : null,
        icon: icon || null,
        color: color || '#667eea',
        order,
        createdBy: req.user._id
      });

      return sendSuccessResponse({ 
        res, 
        status: httpStatus.CREATED, 
        msg: 'Category created successfully.', 
        data: category 
      });
    });
  } catch (err) {
    console.error('Create category error:', err);
    
    if (err.code === 11000) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.CONFLICT, 
        msg: 'Category slug already exists.' 
      });
    }
    
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to create category.', 
      err: err.message 
    });
  }
};

// ======================= UPDATE CATEGORY =======================
exports.updateCategory = async (req, res) => {
  try {
    uploadFile(req, res, async err => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendErrorResponse({ 
            res, 
            status: httpStatus.BAD_REQUEST, 
            msg: 'Image upload error.' 
          });
        }
      } else if (err) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.INTERNAL_SERVER_ERROR, 
          msg: 'Failed to upload image.' 
        });
      }

      const { slug } = req.params;
      const { 
        categoryName, 
        categoryShortDesc, 
        categoryDesc,
        icon,
        color,
        isActive 
      } = req.body;

      // Check admin privileges for category update
      if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.FORBIDDEN, 
          msg: 'Admin privileges required to update categories.' 
        });
      }

      // Find category
      const category = await Category.findOne({ categorySlug: slug });
      if (!category) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.NOT_FOUND, 
          msg: 'Category not found.' 
        });
      }

      // Check if new name conflicts with existing category
      if (categoryName && categoryName !== category.categoryName) {
        const existingCategory = await Category.findOne({ 
          categoryName,
          _id: { $ne: category._id }
        });

        if (existingCategory) {
          return sendErrorResponse({ 
            res, 
            status: httpStatus.CONFLICT, 
            msg: 'Category name already exists.' 
          });
        }
      }

      // Update category
      const updatedCategory = await Category.findOneAndUpdate(
        { categorySlug: slug },
        {
          $set: {
            categoryName: categoryName || category.categoryName,
            categoryShortDesc: categoryShortDesc !== undefined ? categoryShortDesc : category.categoryShortDesc,
            categoryDesc: categoryDesc || category.categoryDesc,
            icon: icon !== undefined ? icon : category.icon,
            color: color || category.color,
            isActive: isActive !== undefined ? isActive : category.isActive,
            image: req.file ? req.file.path : category.image,
            'meta.lastUpdated': new Date()
          }
        },
        { new: true, runValidators: true }
      );

      return sendSuccessResponse({ 
        res, 
        status: httpStatus.OK, 
        msg: 'Category updated successfully.', 
        data: updatedCategory 
      });
    });
  } catch (err) {
    console.error('Update category error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to update category.', 
      err: err.message 
    });
  }
};

// ======================= DELETE CATEGORY =======================
exports.deleteCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    // Check admin privileges
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'Admin privileges required to delete categories.' 
      });
    }

    const category = await Category.findOne({ categorySlug: slug });
    if (!category) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Category not found.' 
      });
    }

    // Check if category has courses
    const courseCount = await Course.countDocuments({ category: category._id });
    if (courseCount > 0) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Cannot delete category with assigned courses. Reassign courses first.' 
      });
    }

    await Category.findByIdAndDelete(category._id);

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: 'Category deleted successfully.' 
    });
  } catch (err) {
    console.error('Delete category error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to delete category.', 
      err: err.message 
    });
  }
};

// ======================= GET CATEGORY BY SLUG =======================
exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ categorySlug: slug })
      .populate('createdBy', 'firstname lastname email');

    if (!category) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Category not found.' 
      });
    }

    // Get published courses count
    const courseCount = await Course.countDocuments({ 
      category: category._id,
      status: 'approved',
      published: true 
    });

    const categoryData = category.toObject();
    categoryData.courseCount = courseCount;

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: 'Category retrieved successfully.', 
      data: categoryData 
    });
  } catch (err) {
    console.error('Get category error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to get category.', 
      err: err.message 
    });
  }
};

// ======================= GET ALL CATEGORIES =======================
exports.getAllCategories = async (req, res) => {
  try {
    let { page, size, sortQuery, searchQuery, selectQuery, populate } = parseFilters(req);
    
    // Default sort by order if no sort provided
    if (!sortQuery) {
      sortQuery = { order: 1, createdAt: -1 };
    }
    
    // Only show active categories for non-admins
    if (!req.user || (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN'))) {
      searchQuery = {
        ...searchQuery,
        isActive: true
      };
    }

    selectQuery = '-categoryName_fuzzy -categoryDesc_fuzzy';

    const result = await sendQueryResponse({
      model: Category,
      page,
      size,
      sortQuery,
      searchQuery,
      selectQuery,
      populate,
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: result.data,
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(size) || 10,
        total: result.totalData,
        totalPages: result.totalPage
      },
      msg: 'Categories retrieved successfully.'
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to get categories.' 
    });
  }
};

// ======================= GET ACTIVE CATEGORIES (FOR COURSE CREATION) =======================
exports.getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ 
      isActive: true 
    })
    .sort({ order: 1 })
    .select('_id categoryName categorySlug categoryShortDesc image icon color')
    .lean();

    // Add course count to each category
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const courseCount = await Course.countDocuments({ 
          category: category._id,
          status: 'approved',
          published: true 
        });
        return { ...category, courseCount };
      })
    );

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: categoriesWithStats,
      msg: 'Active categories retrieved successfully.'
    });
  } catch (err) {
    console.error('Get active categories error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to get active categories.', 
      err: err.message 
    });
  }
};

// ======================= REORDER CATEGORIES =======================
exports.reorderCategories = async (req, res) => {
  try {
    const { categoryOrder } = req.body;

    // Check admin privileges
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'Admin privileges required to reorder categories.' 
      });
    }

    if (!Array.isArray(categoryOrder) || categoryOrder.length === 0) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Category order array is required.' 
      });
    }

    // Update category orders
    const bulkOps = categoryOrder.map((categoryId, index) => ({
      updateOne: {
        filter: { _id: categoryId },
        update: { order: index }
      }
    }));

    await Category.bulkWrite(bulkOps);

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: 'Categories reordered successfully.' 
    });
  } catch (err) {
    console.error('Reorder categories error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to reorder categories.', 
      err: err.message 
    });
  }
};

// ======================= SEARCH CATEGORIES =======================
exports.searchCategories = async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.length < 2) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        data: [],
        msg: 'Search query must be at least 2 characters long.'
      });
    }

    // Only search active categories
    const searchResults = await Category.fuzzySearch(query)
      .where({ isActive: true })
      .select('categoryName categorySlug categoryShortDesc image')
      .limit(20);

    // Filter by confidence score
    const filteredResults = searchResults.filter(category => {
      const confidenceScore = category.confidenceScore || 0;
      return confidenceScore > 5;
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: filteredResults,
      msg: 'Search results retrieved successfully.'
    });
  } catch (error) {
    console.error('Search categories error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to search categories.' 
    });
  }
};

// ======================= GET CATEGORY WITH COURSES =======================
exports.getCategoryWithCourses = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get category
    const category = await Category.findOne({ 
      categorySlug: slug,
      isActive: true 
    });
    
    if (!category) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Category not found.' 
      });
    }

    // Get courses in this category (no descendant categories anymore)
    const courses = await Course.find({
      category: category._id,
      status: 'approved',
      published: true
    })
    .populate([
      {
        path: 'category',
        select: 'categoryName categorySlug'
      },
      {
        path: 'lecturers',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstname lastname email userImage'
        }
      },
      {
        path: 'createdBy',
        select: 'firstname lastname email userImage'
      }
    ])
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalCourses = await Course.countDocuments({
      category: category._id,
      status: 'approved',
      published: true
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        category: {
          _id: category._id,
          categoryName: category.categoryName,
          categorySlug: category.categorySlug,
          categoryDesc: category.categoryDesc,
          image: category.image
        },
        courses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCourses,
          totalPages: Math.ceil(totalCourses / limit)
        }
      },
      msg: 'Category with courses retrieved successfully.'
    });
  } catch (err) {
    console.error('Get category with courses error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to get category with courses.', 
      err: err.message 
    });
  }
};

// ======================= TOGGLE CATEGORY STATUS =======================
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const { isActive } = req.body;

    // Check admin privileges
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'Admin privileges required to toggle category status.' 
      });
    }

    const category = await Category.findOne({ categorySlug: slug });
    if (!category) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Category not found.' 
      });
    }

    // Check if category has courses before deactivating
    if (isActive === false) {
      const courseCount = await Course.countDocuments({ category: category._id });
      if (courseCount > 0) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.BAD_REQUEST, 
          msg: 'Cannot deactivate category with assigned courses. Reassign courses first.' 
        });
      }
    }

    category.isActive = isActive;
    category.meta.lastUpdated = new Date();
    await category.save();

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: `Category ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: category 
    });
  } catch (err) {
    console.error('Toggle category status error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to toggle category status.', 
      err: err.message 
    });
  }
};