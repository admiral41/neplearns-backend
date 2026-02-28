const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const liveClassSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  lecturer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Zoom meeting details
  zoomMeetingId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  zoomJoinUrl: {
    type: String,
    required: false
  },
  zoomStartUrl: {
    type: String,
    required: false
  },
  zoomHostEmail: {
    type: String,
    required: false
  },
  
  // Schedule
  scheduledDateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  startedAt: {
    type: Date,
    required: false
  },
  endedAt: {
    type: Date,
    required: false
  },
  
  // Local recording (stored on lecturer's PC, not server)
  localRecordingPath: {
    type: String,
    required: false
  },
  recordingAvailable: {
    type: Boolean,
    default: false
  },
  
  // Security & Access
  meetingPassword: {
    type: String,
    required: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  allowedStudents: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Analytics
  attendees: [{
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    duration: Number // in minutes
  }],
  
  // Chat logs (stored locally, not on server)
  chatLogPath: {
    type: String,
    required: false
  },
  
  meta: {
    maxParticipants: {
      type: Number,
      default: 100
    },
    waitingRoom: {
      type: Boolean,
      default: true
    },
    autoRecording: {
      type: String,
      enum: ['local', 'cloud', 'none'],
      default: 'local'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
liveClassSchema.index({ course: 1, scheduledDateTime: 1 });
liveClassSchema.index({ lecturer: 1, status: 1 });
liveClassSchema.index({ 'attendees.student': 1 });

// Method to check if a student is enrolled in the course
liveClassSchema.methods.isStudentEnrolled = async function(studentId) {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course).select('learners');
  
  if (!course) return false;
  
  // Check if student is enrolled in the course
  return course.learners.some(learnerId => 
    learnerId.toString() === studentId.toString()
  );
};

// Method to check if user can access the class
liveClassSchema.methods.canUserAccess = async function(userId, userRoles) {
  // SuperAdmin & Admin can access any class
  if (userRoles.includes('SUPERADMIN') || userRoles.includes('ADMIN')) {
    return true;
  }
  
  // Lecturer can access if they're the host
  if (userRoles.includes('LECTURER') && this.lecturer.toString() === userId.toString()) {
    return true;
  }
  
  // For LEARNER: check if enrolled in course
  if (userRoles.includes('LEARNER')) {
    return await this.isStudentEnrolled(userId);
  }
  
  return false;
};

// Hide sensitive data
liveClassSchema.methods.toJSON = function() {
  let liveClass = this.toObject();
  
  // Remove sensitive URLs for non-hosts
  delete liveClass.zoomStartUrl;
  
  return liveClass;
};

// Add these methods to your existing LiveClass model

// Static method to get upcoming classes for a user
liveClassSchema.statics.getUpcomingForUser = async function(userId, userRoles, limit = 10) {
  let query = {
    status: 'scheduled',
    scheduledDateTime: { $gte: new Date() }
  };

  // Filter based on user role
  if (userRoles.includes('LECTURER')) {
    query.lecturer = userId;
  } else if (userRoles.includes('LEARNER')) {
    const Course = mongoose.model('Course');
    const enrolledCourses = await Course.find({
      learners: userId
    }).select('_id');
    query.course = { $in: enrolledCourses.map(c => c._id) };
  }

  return this.find(query)
    .populate('course', 'courseTitle courseSlug')
    .populate('lecturer', 'firstname lastname userImage')
    .sort({ scheduledDateTime: 1 })
    .limit(limit);
};

// Method to get attendance statistics
liveClassSchema.methods.getAttendanceStats = function() {
  const attendees = this.attendees || [];
  const totalAttendees = attendees.length;
  
  if (totalAttendees === 0) {
    return {
      total: 0,
      averageDuration: 0,
      attendanceRate: 0
    };
  }

  const totalDuration = attendees.reduce((sum, attendee) => sum + (attendee.duration || 0), 0);
  const averageDuration = Math.round(totalDuration / totalAttendees);
  
  // Get total enrolled students for attendance rate
  const Course = mongoose.model('Course');
  return Course.findById(this.course).select('learners').then(course => {
    const totalEnrolled = course?.learners?.length || 0;
    const attendanceRate = totalEnrolled > 0 ? Math.round((totalAttendees / totalEnrolled) * 100) : 0;
    
    return {
      total: totalAttendees,
      averageDuration,
      attendanceRate,
      totalEnrolled
    };
  });
};

// Method to check if class can be started
liveClassSchema.methods.canBeStarted = function() {
  const now = new Date();
  const scheduledTime = new Date(this.scheduledDateTime);
  const timeDiff = scheduledTime - now;
  
  return (
    this.status === 'scheduled' &&
    timeDiff <= 10 * 60 * 1000 && // Can start up to 10 minutes early
    timeDiff > -30 * 60 * 1000 // Can start up to 30 minutes late
  );
};

// Method to check if class can be joined
liveClassSchema.methods.canBeJoined = function() {
  const now = new Date();
  const scheduledTime = new Date(this.scheduledDateTime);
  const endTime = new Date(scheduledTime.getTime() + (this.duration * 60000));
  
  return (
    (this.status === 'scheduled' && now >= scheduledTime) ||
    this.status === 'live' ||
    (this.status === 'completed' && now <= endTime)
  );
};

// Method to format class for display
liveClassSchema.methods.toDisplayFormat = function() {
  const liveClass = this.toObject();
  
  const now = new Date();
  const scheduledTime = new Date(liveClass.scheduledDateTime);
  const endTime = new Date(scheduledTime.getTime() + (liveClass.duration * 60000));
  
  // Add time status
  if (liveClass.status === 'scheduled') {
    if (scheduledTime < now) {
      liveClass.timeStatus = 'overdue';
    } else {
      const timeDiff = scheduledTime - now;
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        liveClass.timeStatus = `in ${hours}h ${minutes}m`;
      } else {
        liveClass.timeStatus = `in ${minutes}m`;
      }
    }
  } else if (liveClass.status === 'live') {
    const minutesLeft = Math.max(0, Math.floor((endTime - now) / (1000 * 60)));
    liveClass.timeStatus = `${minutesLeft}m left`;
  }
  
  // Add isUpcoming flag
  liveClass.isUpcoming = liveClass.status === 'scheduled' && scheduledTime > now;
  
  // Add isOngoing flag
  liveClass.isOngoing = liveClass.status === 'live';
  
  // Add isPast flag
  liveClass.isPast = liveClass.status === 'completed' || 
                    (liveClass.status === 'scheduled' && scheduledTime < now);
  
  return liveClass;
};

const LiveClass = mongoose.model('LiveClass', liveClassSchema);
module.exports = LiveClass;