const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const livestreamSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  streamSlug: {
    type: String,
    unique: true,
    slug: "title",
    index: true,
  },
  description: {
    type: String,
    required: false,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  week: {
    type: Schema.Types.ObjectId,
    ref: "Week",
    required: false,
  },
  lesson: {
    type: Schema.Types.ObjectId,
    ref: "Lesson",
    required: false,
  },
  
  // Scheduling
  scheduledStartTime: {
    type: Date,
    required: true,
  },
  scheduledEndTime: {
    type: Date,
    required: false,
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled',
  },
  
  // Actual times
  actualStartTime: {
    type: Date,
    required: false,
  },
  actualEndTime: {
    type: Date,
    required: false,
  },
  
  // Creator information
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lecturers: [{
    type: Schema.Types.ObjectId,
    ref: "Lecturer",
  }],
  
  // External meeting configuration (REMOVED Jitsi)
  meetingType: {
    type: String,
    enum: ['google_meet', 'zoom', 'microsoft_teams', 'custom'],
    required: true,
  },
  meetingUrl: {
    type: String,
    required: true,
    trim: true,
  },
  meetingId: {
    type: String,
    required: false,
  },
  meetingPassword: {
    type: String,
    required: false,
  },
  meetingInstructions: {
    type: String,
    required: false,
  },
  
  // Access control
  isPublic: {
    type: Boolean,
    default: false,
  },
  allowedUsers: [{
    type: Schema.Types.ObjectId,
    ref: "User",
  }],
  
  // Participation tracking
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    joinedAt: Date,
    leftAt: Date,
    duration: Number,
  }],
  
  // Recording
  recordingUrl: {
    type: String,
    required: false,
  },
  isRecorded: {
    type: Boolean,
    default: false,
  },
  
  // Chat transcript
  chatTranscript: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    message: String,
    timestamp: Date,
  }],
  
  // Metadata
  totalViews: {
    type: Number,
    default: 0,
  },
  peakViewers: {
    type: Number,
    default: 0,
  },
  
}, {
  timestamps: true,
});

// Indexes
livestreamSchema.index({ course: 1, scheduledStartTime: -1 });
livestreamSchema.index({ status: 1, scheduledStartTime: 1 });

// Virtual for stream URL
livestreamSchema.virtual('streamUrl').get(function() {
  return `/livestreams/${this.streamSlug}`;
});

// Method to check if user can access this stream
livestreamSchema.methods.canUserAccess = async function(userId, userRoles = []) {
  // Admins and superadmins can access all streams
  if (userRoles.includes('ADMIN') || userRoles.includes('SUPERADMIN')) {
    return true;
  }
  
  // Creator can access
  if (this.createdBy.toString() === userId.toString()) {
    return true;
  }
  
  // Lecturers can access
  const isLecturer = this.lecturers.some(l => l.toString() === userId.toString());
  if (isLecturer) {
    return true;
  }
  
  // If public, anyone can access
  if (this.isPublic) {
    return true;
  }
  
  // Check if user is in allowed users
  const isAllowed = this.allowedUsers.some(u => u.toString() === userId.toString());
  if (isAllowed) {
    return true;
  }
  
  // Check if user is enrolled in the course
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);
  if (course && course.learners.some(l => l.toString() === userId.toString())) {
    return true;
  }
  
  return false;
};

// Get meeting info based on meeting type
livestreamSchema.methods.getMeetingInfo = function() {
  const info = {
    type: this.meetingType,
    url: this.meetingUrl,
    id: this.meetingId,
    hasPassword: !!this.meetingPassword,
    instructions: this.meetingInstructions
  };
  
  // Add platform-specific info
  switch(this.meetingType) {
    case 'zoom':
      info.platform = 'Zoom';
      info.icon = 'https://cdn-icons-png.flaticon.com/512/5968/5968865.png';
      break;
    case 'google_meet':
      info.platform = 'Google Meet';
      info.icon = 'https://cdn-icons-png.flaticon.com/512/5968/5968534.png';
      break;
    case 'microsoft_teams':
      info.platform = 'Microsoft Teams';
      info.icon = 'https://cdn-icons-png.flaticon.com/512/5968/5968885.png';
      break;
    default:
      info.platform = 'Custom Meeting';
      info.icon = 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png';
  }
  
  return info;
};

// Hide sensitive data
livestreamSchema.methods.toJSON = function() {
  let stream = this.toObject();
  delete stream.__v;
  return stream;
};

const Livestream = mongoose.model('Livestream', livestreamSchema);
module.exports = Livestream;