const Feature = require('../models/feature.model');
const User = require('../models/user.model');

// Default features data (matching the static data in frontend)
const defaultFeatures = [
  {
    icon: 'GraduationCap',
    title: 'Experienced Teachers',
    description: "Learn from Nepal's top educators with proven track records in SEE and +2 results",
    displayOrder: 1,
  },
  {
    icon: 'Award',
    title: 'Quality Education',
    description: 'Focused on helping every student achieve their best results',
    displayOrder: 2,
  },
  {
    icon: 'Video',
    title: 'Daily Live Classes',
    description: 'Join interactive live classes every day with expert teachers and real-time Q&A sessions',
    displayOrder: 3,
  },
  {
    icon: 'Users',
    title: 'Doubt Clearing',
    description: 'Get your doubts cleared by teachers through chat, call, or live sessions',
    displayOrder: 4,
  },
  {
    icon: 'BookOpen',
    title: 'Complete Study Material',
    description: 'Access chapter-wise notes, practice sets, model questions, and previous year papers',
    displayOrder: 5,
  },
  {
    icon: 'TrendingUp',
    title: 'Regular Mock Tests',
    description: 'Practice with mock tests and get detailed performance analysis to track progress',
    displayOrder: 6,
  },
];

/**
 * Seed features if none exist
 * Called once during server startup
 */
async function seedFeatures() {
  try {
    // Check if features already exist
    const existingCount = await Feature.countDocuments();

    if (existingCount > 0) {
      console.log(`✓ Features already seeded (${existingCount} features exist)`);
      return;
    }

    // Find a superadmin to set as creator
    const superAdmin = await User.findOne({ roles: 'SUPERADMIN' });

    if (!superAdmin) {
      console.log('⚠ No SUPERADMIN found, skipping feature seeding');
      return;
    }

    // Create features
    const featuresWithCreator = defaultFeatures.map(feature => ({
      ...feature,
      createdBy: superAdmin._id,
      isActive: true,
    }));

    await Feature.insertMany(featuresWithCreator);

    console.log(`✓ Seeded ${defaultFeatures.length} features successfully`);
  } catch (error) {
    console.error('✗ Error seeding features:', error.message);
  }
}

module.exports = seedFeatures;
