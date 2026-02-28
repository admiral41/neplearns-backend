/**
 * Seed Courses Utility
 * Runs all course seeders once on server initialization
 * Imports data from existing seeder files (no duplication)
 */

const Category = require("../models/category");
const Course = require("../models/course.model");
const Week = require("../models/weeks");
const Lesson = require("../models/lessons");
const User = require("../models/user.model");
const Lecturer = require("../models/lecturer.model");

// Import data from existing seeders
const {
  seeScienceCategoryData,
  seeScienceCourseData,
  seeScienceWeeks,
  seeEnglishCategoryData,
  seeEnglishCourseData,
  seeEnglishWeeks,
} = require("../seeders/seeCourseSeeder");

const {
  mathCategoryData,
  mathCourseData,
  mathCourseWeeks,
} = require("../seeders/grade9MathSeeder");

const {
  computerCategoryData,
  computerCourseData,
  computerCourseWeeks,
} = require("../seeders/grade9ComputerSeeder");

// All courses to seed
const allCoursesData = [
  { category: seeScienceCategoryData, course: seeScienceCourseData, weeks: seeScienceWeeks },
  { category: seeEnglishCategoryData, course: seeEnglishCourseData, weeks: seeEnglishWeeks },
  { category: mathCategoryData, course: mathCourseData, weeks: mathCourseWeeks },
  { category: computerCategoryData, course: computerCourseData, weeks: computerCourseWeeks },
];

async function seedCourses() {
  try {
    // Check if courses already exist
    const categoryNames = allCoursesData.map((c) => c.category.categoryName);
    const existingCategories = await Category.find({
      categoryName: { $in: categoryNames },
    });

    if (existingCategories.length >= allCoursesData.length) {
      console.log(`✔ Courses already seeded (${existingCategories.length} categories found).`);
      return;
    }

    // Get admin user
    const adminUser = await User.findOne({
      roles: { $in: ["ADMIN", "SUPERADMIN"] },
    });

    if (!adminUser) {
      console.log("⚠ Admin user not found. Skipping course seeding.");
      return;
    }

    // Get or create lecturer
    let lecturer = await Lecturer.findOne({
      requestStatus: "approved",
      isActive: true,
    });

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

    let seededCount = 0;

    for (const data of allCoursesData) {
      // Skip if category already exists
      const existingCategory = await Category.findOne({
        categoryName: data.category.categoryName,
      });

      if (existingCategory) {
        continue;
      }

      // Create category
      const category = new Category({
        ...data.category,
        createdBy: adminUser._id,
      });
      await category.save();

      // Create course
      const course = new Course({
        ...data.course,
        category: category._id,
        createdBy: adminUser._id,
        creatorType: "admin",
        lecturers: [lecturer._id],
        publishedAt: new Date(),
      });
      await course.save();

      // Create weeks and lessons
      let totalLessons = 0;
      for (const weekData of data.weeks) {
        const { lessons, ...weekInfo } = weekData;

        const week = new Week({
          ...weekInfo,
          course: course._id,
        });
        await week.save();

        for (const lessonData of lessons) {
          const lesson = new Lesson({
            ...lessonData,
            week: week._id,
            createdBy: adminUser._id,
          });
          await lesson.save();
          totalLessons++;
        }
      }

      // Update course totals
      course.totalWeeks = data.weeks.length;
      course.totalLessons = totalLessons;
      await course.save();

      // Update category
      category.meta.courseCount = 1;
      await category.save();

      seededCount++;
      console.log(`  ✔ Seeded: ${data.category.categoryName}`);
    }

    if (seededCount > 0) {
      console.log(`✔ Seeded ${seededCount} courses successfully.`);
    }
  } catch (error) {
    console.error("Error seeding courses:", error.message);
  }
}

module.exports = seedCourses;
