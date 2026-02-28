/**
 * Master Seeder - Runs all seeders at once
 *
 * Usage:
 *   node seeders/index.js              # Run all seeders
 *   node seeders/index.js --fresh      # Clear all data first, then seed
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/category");
const Course = require("../models/course.model");
const Week = require("../models/weeks");
const Lesson = require("../models/lessons");
const User = require("../models/user.model");
const Lecturer = require("../models/lecturer.model");

// Import data from existing seeders (no duplication!)
const {
  seeScienceCategoryData,
  seeScienceCourseData,
  seeScienceWeeks,
  seeEnglishCategoryData,
  seeEnglishCourseData,
  seeEnglishWeeks,
} = require("./seeCourseSeeder");

const {
  mathCategoryData,
  mathCourseData,
  mathCourseWeeks,
} = require("./grade9MathSeeder");

const {
  computerCategoryData,
  computerCourseData,
  computerCourseWeeks,
} = require("./grade9ComputerSeeder");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/padhaihub";

// All courses configuration
const allCourses = [
  { category: seeScienceCategoryData, course: seeScienceCourseData, weeks: seeScienceWeeks },
  { category: seeEnglishCategoryData, course: seeEnglishCourseData, weeks: seeEnglishWeeks },
  { category: mathCategoryData, course: mathCourseData, weeks: mathCourseWeeks },
  { category: computerCategoryData, course: computerCourseData, weeks: computerCourseWeeks },
];

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
}

async function clearAllSeedData() {
  console.log("\n🗑️  Clearing all existing seed data...");
  const categoryNames = allCourses.map((c) => c.category.categoryName);

  for (const categoryName of categoryNames) {
    const category = await Category.findOne({ categoryName });
    if (category) {
      const courses = await Course.find({ category: category._id });
      for (const course of courses) {
        const weeks = await Week.find({ course: course._id });
        for (const week of weeks) {
          await Lesson.deleteMany({ week: week._id });
        }
        await Week.deleteMany({ course: course._id });
      }
      await Course.deleteMany({ category: category._id });
      await Category.deleteOne({ _id: category._id });
      console.log(`  ✓ Cleared: ${categoryName}`);
    }
  }
}

async function getOrCreateAdminUser() {
  let adminUser = await User.findOne({ roles: { $in: ["ADMIN", "SUPERADMIN"] } });
  if (!adminUser) {
    adminUser = await User.findOne({});
    if (!adminUser) {
      throw new Error("No users found. Create a user first.");
    }
  }
  return adminUser;
}

async function getOrCreateLecturer(adminUser) {
  let lecturer = await Lecturer.findOne({ requestStatus: "approved", isActive: true });
  if (!lecturer) {
    lecturer = await Lecturer.findOne({ user: adminUser._id });
    if (!lecturer) {
      lecturer = new Lecturer({
        user: adminUser._id,
        cv: "uploads/admin-cv.pdf",
        certificates: [],
        requestStatus: "approved",
        isActive: true,
      });
      await lecturer.save();
    }
  }
  return lecturer;
}

async function createCourseWithContent(courseConfig, adminUser, lecturer) {
  const { category: categoryData, course: courseData, weeks: weeksData } = courseConfig;

  // Check if already exists
  let category = await Category.findOne({ categoryName: categoryData.categoryName });
  if (category) {
    return null;
  }

  // Create category
  category = new Category({ ...categoryData, createdBy: adminUser._id });
  await category.save();

  // Create course
  const course = new Course({
    ...courseData,
    category: category._id,
    createdBy: adminUser._id,
    creatorType: "admin",
    lecturers: [lecturer._id],
    publishedAt: new Date(),
  });
  await course.save();

  // Create weeks and lessons
  let totalLessons = 0;
  for (const weekData of weeksData) {
    const { lessons, ...weekInfo } = weekData;
    const week = new Week({ ...weekInfo, course: course._id });
    await week.save();

    for (const lessonData of lessons) {
      const lesson = new Lesson({ ...lessonData, week: week._id, createdBy: adminUser._id });
      await lesson.save();
      totalLessons++;
    }
  }

  course.totalWeeks = weeksData.length;
  course.totalLessons = totalLessons;
  await course.save();

  category.meta.courseCount = 1;
  await category.save();

  return { category, course, totalLessons };
}

async function seed() {
  const args = process.argv.slice(2);
  const fresh = args.includes("--fresh") || args.includes("-f");

  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║        PADHAIHUB MASTER SEEDER                 ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  try {
    await connectDB();

    if (fresh) {
      await clearAllSeedData();
    }

    const adminUser = await getOrCreateAdminUser();
    const lecturer = await getOrCreateLecturer(adminUser);

    console.log("📚 Creating courses...\n");

    let seededCount = 0;
    for (const courseConfig of allCourses) {
      const result = await createCourseWithContent(courseConfig, adminUser, lecturer);
      if (result) {
        seededCount++;
        console.log(`  ✅ ${result.category.categoryName}: ${result.course.courseTitle}`);
        console.log(`     Weeks: ${result.course.totalWeeks}, Lessons: ${result.totalLessons}`);
      } else {
        console.log(`  ⏭️  Skipped: ${courseConfig.category.categoryName} (already exists)`);
      }
    }

    console.log("\n========================================");
    console.log(`✔ Seeding completed! Created ${seededCount} courses.`);
    console.log("========================================\n");

  } catch (error) {
    console.error("❌ Seeding error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run only if executed directly
if (require.main === module) {
  seed();
}

module.exports = { allCourses };
