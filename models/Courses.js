const mongoose = require('mongoose');
const slugify = require('slugify');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  price: { type: Number, required: true },
  slug: { type: String, unique: true },
  tags: [{ type: String }],
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  image: { type: String },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  enrollmentRequests: [{
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    requestedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  enrolledStudents: [{
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    enrolledAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, { timestamps: true });

courseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    this.slug = `${baseSlug}-${Math.random().toString(36).substr(2, 5)}`;
  }
  next();
});

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;