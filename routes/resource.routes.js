const router = require("express").Router();
const resourceController = require("../controllers/resource.controller");
const { verifyUser, verifyRole } = require("../middlewares/auth");
const upload = require("../middlewares/multer");

// All routes require authentication
router.use(verifyUser);

// Lesson resources
router.get("/lesson/:lessonId", resourceController.getResourcesByLesson);

// Create resource (requires Lecturer, Admin, or SuperAdmin)
router.post(
    "/",
    verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
    upload.single('resourceFile'), // Field name for file upload
    resourceController.createResource
);

// Update resource
router.put(
    "/:resourceId",
    verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
    resourceController.updateResource
);

// Delete resource
router.delete(
    "/:resourceId",
    verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
    resourceController.deleteResource
);

module.exports = router;
