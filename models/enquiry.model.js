const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Enquiry = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        level: {
            type: String,
            required: true,
            enum: ['see', 'plus2-science', 'plus2-management', 'plus2-humanities', 'other']
        },
        message: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['pending', 'contacted', 'resolved', 'rejected'],
            default: 'pending'
        },
        notes: {
            type: String,
            default: ''
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false
        }
    },
    {
        timestamps: true,
    }
);

// Hide some attributes while sending json response
Enquiry.methods.toJSON = function () {
    let enquiry = this.toObject();
    delete enquiry.updatedAt;
    delete enquiry.__v;
    return enquiry;
};

module.exports = mongoose.model('Enquiry', Enquiry);
