const router = require("express").Router();
const categoryController = require("../controllers/category.controller");
const { verifyUser, verifyAdmin, checkAuth } = require("../middlewares/auth");

// ======================= PUBLIC ROUTES =======================
router.get("/", checkAuth, categoryController.getAllCategories);
router.get("/active", checkAuth, categoryController.getActiveCategories);
router.get("/search", checkAuth, categoryController.searchCategories);
router.get("/:slug", checkAuth, categoryController.getCategoryBySlug);
router.get("/:slug/courses", checkAuth, categoryController.getCategoryWithCourses);

// ======================= ADMIN ROUTES =======================
router.post("/create", verifyAdmin, categoryController.createCategory);
router.put("/:slug", verifyAdmin, categoryController.updateCategory);
router.delete("/:slug", verifyAdmin, categoryController.deleteCategory);
router.put("/reorder", verifyAdmin, categoryController.reorderCategories);
router.put("/:slug/toggle", verifyAdmin, categoryController.toggleCategoryStatus);

module.exports = router;