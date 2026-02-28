const rateLimit = require("express-rate-limit");

// Rate limiter for public enquiry form
const enquiryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 requests per 15 minutes per IP
    message: {
        success: false,
        message: "Too many enquiry submissions from this IP. Please try again after 15 minutes."
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipSuccessfulRequests: false
});

// Rate limiter for newsletter subscription
const newsletterLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Max 3 requests per 15 minutes per IP
    message: {
        success: false,
        message: "Too many subscription attempts from this IP. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per 15 minutes per IP
    message: {
        success: false,
        message: "Too many requests from this IP. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

module.exports = {
    enquiryLimiter,
    newsletterLimiter,
    apiLimiter
};
