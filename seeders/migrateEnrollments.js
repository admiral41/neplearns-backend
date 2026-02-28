/**
 * Migration script to populate Enrollment collection from existing course.learners data
 *
 * Run with: node seeders/migrateEnrollments.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');

// Use the MongoDB URI from .env
const MONGO_URI = process.env.MONGO_DB_LOCAL || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('ERROR: MongoDB URI not found in .env file (MONGO_DB_LOCAL or MONGO_URI)');
  process.exit(1);
}

async function migrateEnrollments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all courses with learners
    const courses = await Course.find({
      learners: { $exists: true, $ne: [] }
    }).select('_id learners learn_type price finalPrice createdAt');

    console.log(`Found ${courses.length} courses with learners`);

    let totalMigrated = 0;
    let totalSkipped = 0;

    for (const course of courses) {
      console.log(`\nProcessing course: ${course._id}`);
      console.log(`  Learners: ${course.learners.length}`);

      for (const learnerId of course.learners) {
        try {
          // Check if enrollment already exists
          const existingEnrollment = await Enrollment.findOne({
            student: learnerId,
            course: course._id
          });

          if (existingEnrollment) {
            totalSkipped++;
            continue;
          }

          // Determine payment info based on course type
          const isPaid = course.learn_type === 'PAID';
          const paymentAmount = isPaid ? (course.finalPrice || course.price || 0) : 0;

          // Create enrollment record
          await Enrollment.create({
            student: learnerId,
            course: course._id,
            enrolledAt: course.createdAt, // Use course creation as fallback date
            paymentAmount: paymentAmount,
            paymentMethod: isPaid ? 'other' : 'free',
            paymentStatus: 'completed',
            status: 'active',
            progress: 0
          });

          totalMigrated++;
        } catch (err) {
          if (err.code === 11000) {
            // Duplicate key error - enrollment already exists
            totalSkipped++;
          } else {
            console.error(`  Error migrating learner ${learnerId}:`, err.message);
          }
        }
      }
    }

    console.log('\n========== Migration Complete ==========');
    console.log(`Total enrollments migrated: ${totalMigrated}`);
    console.log(`Total skipped (already exists): ${totalSkipped}`);

    // Show final count
    const totalEnrollments = await Enrollment.countDocuments();
    console.log(`Total enrollments in database: ${totalEnrollments}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migrateEnrollments();
