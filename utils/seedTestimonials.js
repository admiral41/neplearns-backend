
const User = require("../models/user.model");
const SuccessStory = require("../models/successStory.model");
const bcrypt = require("bcryptjs");

const testimonialData = [
  {
    user: {
      firstname: "Aayush",
      lastname: "Karki",
      email: "aayush.testimonial@neplearn.com",
      phone: "9800000001",
      gender: "Male",
      currentLevel: "SEE",
      city: "Kathmandu",
    },
    story: {
      achievement: "SEE Graduate - GPA 3.95",
      testimonial:
        "Neplearn को classes ले मलाई SEE मा 3.95 GPA ल्याउन मद्दत गर्यो! Video lessons धेरै clear थिए र practice tests ले राम्रोसँग prepare गर्न सजिलो बनायो। Teachers सधैं doubt clear गर्न available हुनुहुन्थ्यो।",
      courseName: "Complete SEE Preparation",
      rating: 5,
    },
  },
  {
    user: {
      firstname: "Shreya",
      lastname: "Shrestha",
      email: "shreya.testimonial@neplearn.com",
      phone: "9800000002",
      gender: "Female",
      currentLevel: "+2 Science",
      city: "Lalitpur",
    },
    story: {
      achievement: "+2 Science - GPA 3.85",
      testimonial:
        "Physics र Chemistry मा struggle गरिरहेको थिएँ, तर detailed video explanations र practice problems ले concepts राम्रोसँग बुझ्न मद्दत गर्यो। +2 मा 3.85 GPA आयो! Thank you Neplearn!",
      courseName: "+2 Science Complete Package",
      rating: 5,
    },
  },
  {
    user: {
      firstname: "Bibek",
      lastname: "Ghimire",
      email: "bibek.testimonial@neplearn.com",
      phone: "9800000003",
      gender: "Male",
      currentLevel: "SEE",
      city: "Pokhara",
    },
    story: {
      achievement: "SEE Graduate - Mathematics A+",
      testimonial:
        "Mathematics मेरो सबैभन्दा कमजोर subject थियो, तर teachers को teaching method ले सबै कुरा सजिलो बनाइदियो। SEE मा Math र Optional Math दुवैमा A+ आयो। Best decision I made with Neplearn!",
      courseName: "Mathematics Mastery - SEE Level",
      rating: 5,
    },
  },
  {
    user: {
      firstname: "Anisha",
      lastname: "Tamang",
      email: "anisha.testimonial@neplearn.com",
      phone: "9800000004",
      gender: "Female",
      currentLevel: "+2 Management",
      city: "Biratnagar",
    },
    story: {
      achievement: "+2 Management - GPA 3.90",
      testimonial:
        "Accountancy र Economics को courses excellent थिए। Teachers ले सबै कुरा step-by-step explain गर्नुभयो र study materials धेरै helpful थिए। +2 Management मा 3.90 GPA ल्याएँ with Neplearn!",
      courseName: "+2 Management Complete Package",
      rating: 5,
    },
  },
  {
    user: {
      firstname: "Rajan",
      lastname: "Thapa",
      email: "rajan.testimonial@neplearn.com",
      phone: "9800000005",
      gender: "Male",
      currentLevel: "SEE",
      city: "Chitwan",
    },
    story: {
      achievement: "SEE Graduate - GPA 3.80",
      testimonial:
        "Live classes मा directly teachers सँग interact गर्न पाउँदा पढाइ धेरै interesting भयो। Doubt clearing sessions ले confusing topics clear गर्न मद्दत गर्यो। Highly recommended Neplearn!",
      courseName: "Complete SEE Preparation",
      rating: 5,
    },
  },
  {
    user: {
      firstname: "Srijana",
      lastname: "Adhikari",
      email: "srijana.testimonial@neplearn.com",
      phone: "9800000006",
      gender: "Female",
      currentLevel: "+2 Science",
      city: "Butwal",
    },
    story: {
      achievement: "+2 Science - Biology A+",
      testimonial:
        "Biology को diagrams र explanations धेरै detailed थिए। Neplearn को notes र video lessons ले exam preparation सजिलो बनायो। अब medical entrance को लागि पनि यहीँबाट prepare गर्ने plan छ!",
      courseName: "+2 Science Biology Course",
      rating: 5,
    },
  },
];

async function seedTestimonials() {
  try {
    // Check if testimonials already exist
    const existingCount = await SuccessStory.countDocuments();
    if (existingCount >= 6) {
      console.log(`✔ Testimonials already seeded (${existingCount} found).`);
      return;
    }

    // Get SUPERADMIN for createdBy field
    const superAdmin = await User.findOne({ roles: "SUPERADMIN" });
    if (!superAdmin) {
      console.log("⚠ SUPERADMIN not found. Skipping testimonial seeding.");
      return;
    }

    // Create dummy password hash for testimonial users
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("TestimonialUser@123", salt);

    let seededCount = 0;

    for (const data of testimonialData) {
      // Check if user already exists
      let user = await User.findOne({ email: data.user.email });

      if (!user) {
        // Create testimonial user
        user = new User({
          ...data.user,
          roles: ["LEARNER"],
          isVerified: true,
          verificationCode: 0,
          salt,
          hash,
        });
        await user.save();
      }

      // Check if story already exists for this user
      const existingStory = await SuccessStory.findOne({ user: user._id });
      if (!existingStory) {
        // Create success story
        const story = new SuccessStory({
          user: user._id,
          ...data.story,
          isActive: true,
          createdBy: superAdmin._id,
        });
        await story.save();
        seededCount++;
      }
    }

    if (seededCount > 0) {
      console.log(`✔ Seeded ${seededCount} testimonials successfully.`);
    } else {
      console.log("✔ All testimonials already exist.");
    }
  } catch (error) {
    console.error("Error seeding testimonials:", error.message);
  }
}

module.exports = seedTestimonials;