const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resourceSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['FILE', 'LINK'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    lesson: {
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    fileType: {
        type: String,
        required: false // e.g., 'pdf', 'image', 'video', 'link'
    },
    fileSize: {
        type: Number,
        required: false // in bytes
    },
    originalName: {
        type: String,
        required: false // original filename if it's a file
    }
}, {
    timestamps: true
});

// Hide sensitive data
resourceSchema.methods.toJSON = function() {
    let resource = this.toObject();
    delete resource.__v;
    return resource;
};

// Index for faster lookups
resourceSchema.index({ lesson: 1, isActive: 1 });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
