const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let User = new Schema(
    {
        firstname: {
            type: String,
            required: true,
        },
        lastname: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
        },
        dob: {
            type: Date,
            required: false,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: false,
        },
        address: {
            type: String,
            required: false,
        },
        city: {
            type: String,
            required: false,
        },
        province: {
            type: String,
            required: false,
        },
        userImage: {
            type: String,
            default: ''
        },
        roles: {
            type: [String],
            enum: ['LEARNER', 'LECTURER', 'ADMIN', 'SUPERADMIN'],
            default: ['LEARNER']
        },

        // Learner specific fields
        currentLevel: {
            type: String,
            required: false,
        },
        stream: {
            type: String,
            required: false,
        },
        schoolCollege: {
            type: String,
            required: false,
        },

        // Parent/Guardian information
        fatherName: {
            type: String,
            required: false,
        },
        fatherPhone: {
            type: String,
            required: false,
        },
        motherName: {
            type: String,
            required: false,
        },
        motherPhone: {
            type: String,
            required: false,
        },
        guardianName: {
            type: String,
            required: false,
        },
        guardianPhone: {
            type: String,
            required: false,
        },
        guardianRelation: {
            type: String,
            required: false,
        },

        // Lecturer specific fields (will be populated after verification)
        highestEducation: {
            type: String,
            required: false,
        },
        universityCollege: {
            type: String,
            required: false,
        },
        majorSpecialization: {
            type: String,
            required: false,
        },
        teachingExperience: {
            type: Number,
            default: 0,
        },
        employmentStatus: {
            type: String,
            required: false,
        },
        preferredLevel: {
            type: String,
            required: false,
        },
        subjects: [{
            type: String,
        }],
        availability: {
            type: String,
            required: false,
        },
        teachingMotivation: {
            type: String,
            required: false,
        },

        // Social links
        linkedin: {
            type: String,
            required: false,
        },
        twitter: {
            type: String,
            required: false,
        },
        website: {
            type: String,
            required: false,
        },

        isSuspended: {
            type: Boolean,
            default: false,
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        verificationCode: {
            type: Number,
        },
        hash: {
            type: String,
            required: true
        },
        salt: {
            type: String,
            required: true
        },
        isLecturerApplicant: {
            type: Boolean,
            default: false
        },

        // Password reset fields
        resetPasswordToken: {
            type: Number,
        },
        resetPasswordExpires: {
            type: Date,
        },

        // Session management - for single session enforcement
        tokenVersion: {
            type: Number,
            default: 0,
        },

        // Force password reset (set by admin when resetting user password)
        forcePasswordReset: {
            type: Boolean,
            default: false,
        },
        lastLoginAt: {
            type: Date,
        },
        lastLoginDevice: {
            type: String,
        },

        // Legal compliance - Terms and Privacy Policy acceptance
        termsAcceptedAt: {
            type: Date,
            required: false,
        },
        privacyPolicyAcceptedAt: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

User.methods.toJSON = function () {
    let user = this.toObject();
    delete user.hash;
    delete user.salt;
    delete user.verificationCode;
    delete user.__v;
    return user;
};

module.exports = mongoose.model('User', User);