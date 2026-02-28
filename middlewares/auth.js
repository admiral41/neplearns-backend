const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { responseHandler } = require("../helpers/index");
const httpStatus = require("http-status");
const Lecturer = require("../models/lecturer.model");
const { sendErrorResponse } = responseHandler;

// Use consistent JWT secret name
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

const decodeToken = (auth) => {
    try {
        if (!auth || typeof auth !== 'string') {
            return null;
        }
        
        const parts = auth.split(" ");
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        
        const token = parts[1];
        if (!token) {
            return null;
        }
        
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        console.error('Token decode error:', e.message);
        return null;
    }
};

const getUser = async (userId) => {
    try {
        return await User.findById(userId)
            .select("-hash -salt -verificationCode")
            .lean();
    } catch (error) {
        console.error('Get user error:', error.message);
        return null;
    }
};

const getLecturer = async (userId) => {
    try {
        return await Lecturer.findOne({ 
            user: userId,
            requestStatus: 'approved',
            isActive: true,
            isDeleted: false 
        }).select("user joinDate requestStatus isActive");
    } catch (error) {
        console.error('Get lecturer error:', error.message);
        return null;
    }
};

// Base authentication middleware - ALWAYS sets req.user if token is valid
module.exports.verifyUser = async (req, res, next) => {
    try {
        console.log('=== verifyUser Middleware Called ===');
        console.log('Authorization header:', req.headers.authorization);
        
        if (!req.headers.authorization) {
            console.log('No authorization header found');
            return sendErrorResponse({ 
                res, 
                status: httpStatus.UNAUTHORIZED, 
                msg: "Authentication required. Please login." 
            });
        }

        let decodedResult = decodeToken(req.headers.authorization);
        console.log('Decoded result:', decodedResult);
        
        if (!decodedResult) {
            console.log('Token decoding failed - invalid or expired token');
            return sendErrorResponse({ 
                res, 
                status: httpStatus.UNAUTHORIZED, 
                msg: "Invalid or expired token. Please login again." 
            });
        }

        let userData = await getUser(decodedResult.userId);
        console.log('User data retrieved:', userData ? `Yes - ${userData.email}` : 'No');

        if (!userData) {
            console.log('User not found in database');
            return sendErrorResponse({
                res,
                status: httpStatus.UNAUTHORIZED,
                msg: "User not found. Please login again."
            });
        }

        // SINGLE SESSION ENFORCEMENT
        // Check if token version matches (token was issued after last login)
        const tokenVersion = decodedResult.tokenVersion || 0;
        const userTokenVersion = userData.tokenVersion || 0;

        if (tokenVersion !== userTokenVersion) {
            console.log(`Token version mismatch: token=${tokenVersion}, user=${userTokenVersion}`);
            return sendErrorResponse({
                res,
                status: httpStatus.UNAUTHORIZED,
                msg: "Session expired. You have been logged out because your account was accessed from another device.",
                code: "SESSION_INVALID"
            });
        }

        // Check if user is suspended
        if (userData.isSuspended) {
            console.log('User is suspended:', userData.email);
            return sendErrorResponse({
                res,
                status: httpStatus.FORBIDDEN,
                msg: "Your account is suspended. Contact administrator."
            });
        }

        // Check if email is verified (for all users except admin can bypass)
        if (!userData.isVerified && !userData.roles.includes('ADMIN') && !userData.roles.includes('SUPERADMIN')) {
            console.log('Email not verified for non-admin user');
            return sendErrorResponse({ 
                res, 
                status: httpStatus.FORBIDDEN, 
                msg: "Please verify your email before accessing this resource." 
            });
        }

        console.log('Authentication successful for user:', userData.email);
        console.log('User roles:', userData.roles);
        req.user = userData;
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        console.error('Error stack:', error.stack);
        return sendErrorResponse({ 
            res, 
            status: httpStatus.INTERNAL_SERVER_ERROR, 
            msg: "Authentication failed. Please try again." 
        });
    }
};

module.exports.checkAuth = async (req, res, next) => {
    try {
        console.log('=== checkAuth Middleware Called ===');
        console.log('Authorization header:', req.headers.authorization);
        
        // Initialize req.user as null
        req.user = null;
        
        if (!req.headers.authorization) {
            console.log('No authorization header - proceeding as guest');
            return next();
        }

        let decodedResult = decodeToken(req.headers.authorization);
        
        if (decodedResult) {
            console.log('Token decoded successfully, userId:', decodedResult.userId);
            let userData = await getUser(decodedResult.userId);
            
            if (userData && !userData.isSuspended) {
                console.log('User found and not suspended:', userData.email);
                req.user = userData;
            } else {
                console.log('User not found or suspended');
            }
        } else {
            console.log('Token decoding failed - proceeding as guest');
        }

        console.log('checkAuth completed, req.user:', req.user ? req.user.email : 'null');
        next();
    } catch (error) {
        console.error('Optional auth error:', error.message);
        // Don't fail the request for optional auth
        req.user = null;
        next();
    }
};

// ADMIN middleware (allows both ADMIN and SUPERADMIN)
module.exports.verifyAdmin = async (req, res, next) => {
    try {
        console.log('=== verifyAdmin Middleware Called ===');
        console.log('Current req.user:', req.user ? req.user.email : 'null');
        
        if (!req.user) {
            console.log('No user found - checking if token exists');
            
            // Try to authenticate from token
            if (req.headers.authorization) {
                console.log('Token exists, trying to authenticate...');
                const decodedResult = decodeToken(req.headers.authorization);
                
                if (decodedResult) {
                    const userData = await getUser(decodedResult.userId);
                    if (userData && !userData.isSuspended) {
                        req.user = userData;
                        console.log('User authenticated from token:', req.user.email);
                    }
                }
            }
            
            // Still no user? Then fail
            if (!req.user) {
                console.log('Still no user after token check');
                return sendErrorResponse({ 
                    res, 
                    status: httpStatus.UNAUTHORIZED, 
                    msg: "Authentication required." 
                });
            }
        }

        console.log('User found:', req.user.email);
        console.log('User roles:', req.user.roles);
        
        const hasAdminAccess = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');
        console.log('Has admin access:', hasAdminAccess);
        
        if (!hasAdminAccess) {
            console.log('User does not have admin access');
            return sendErrorResponse({ 
                res, 
                status: httpStatus.FORBIDDEN, 
                msg: "Access denied. Admin privileges required." 
            });
        }

        console.log('Admin verification successful');
        next();
    } catch (error) {
        console.error('Admin verification error:', error.message);
        console.error('Error stack:', error.stack);
        return sendErrorResponse({ 
            res, 
            status: httpStatus.INTERNAL_SERVER_ERROR, 
            msg: "Authorization failed." 
        });
    }
};

// SUPERADMIN only middleware
module.exports.verifySuperAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return sendErrorResponse({ 
                res, 
                status: httpStatus.UNAUTHORIZED, 
                msg: "Authentication required." 
            });
        }

        if (!req.user.roles.includes('SUPERADMIN')) {
            return sendErrorResponse({ 
                res, 
                status: httpStatus.FORBIDDEN, 
                msg: "Access denied. SUPERADMIN privileges required." 
            });
        }

        next();
    } catch (error) {
        console.error('SuperAdmin verification error:', error.message);
        return sendErrorResponse({ 
            res, 
            status: httpStatus.INTERNAL_SERVER_ERROR, 
            msg: "Authorization failed." 
        });
    }
};

// LECTURER middleware
module.exports.verifyLecturer = async (req, res, next) => {
    try {
        console.log('=== verifyLecturer Middleware Called ===');
        
        if (!req.user) {
            console.log('No user found - checking if token exists');
            
            // Try to authenticate from token
            if (req.headers.authorization) {
                const decodedResult = decodeToken(req.headers.authorization);
                
                if (decodedResult) {
                    const userData = await getUser(decodedResult.userId);
                    if (userData && !userData.isSuspended) {
                        req.user = userData;
                        console.log('User authenticated from token:', req.user.email);
                    }
                }
            }
            
            if (!req.user) {
                return sendErrorResponse({ 
                    res, 
                    status: httpStatus.UNAUTHORIZED, 
                    msg: "Authentication required." 
                });
            }
        }

        // Check if user has LECTURER role
        if (!req.user.roles.includes('LECTURER')) {
            return sendErrorResponse({ 
                res, 
                status: httpStatus.FORBIDDEN, 
                msg: "Access denied. Lecturer privileges required." 
            });
        }

        // Check if lecturer is approved and active
        const lecturer = await getLecturer(req.user._id);
        
        if (!lecturer) {
            return sendErrorResponse({ 
                res, 
                status: httpStatus.FORBIDDEN, 
                msg: "Your lecturer account is not approved or is inactive." 
            });
        }

        if (lecturer.requestStatus !== 'approved' || !lecturer.isActive) {
            return sendErrorResponse({ 
                res, 
                status: httpStatus.FORBIDDEN, 
                msg: "Your lecturer account is pending approval or is inactive." 
            });
        }

        req.lecturer = lecturer;
        next();
    } catch (error) {
        console.error('Lecturer verification error:', error.message);
        return sendErrorResponse({ 
            res, 
            status: httpStatus.INTERNAL_SERVER_ERROR, 
            msg: "Authorization failed." 
        });
    }
};

// LEARNER middleware
module.exports.verifyLearner = async (req, res, next) => {
    try {
        if (!req.user) {
            return sendErrorResponse({ 
                res, 
                status: httpStatus.UNAUTHORIZED, 
                msg: "Authentication required." 
            });
        }

        // Check if user has LEARNER role (all users are learners by default)
        if (!req.user.roles.includes('LEARNER')) {
            return sendErrorResponse({ 
                res, 
                status: httpStatus.FORBIDDEN, 
                msg: "Access denied. Learner privileges required." 
            });
        }

        next();
    } catch (error) {
        console.error('Learner verification error:', error.message);
        return sendErrorResponse({ 
            res, 
            status: httpStatus.INTERNAL_SERVER_ERROR, 
            msg: "Authorization failed." 
        });
    }
};

// Role-based access control middleware (flexible)
module.exports.verifyRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            console.log('=== verifyRole Middleware Called ===');
            console.log('Allowed roles:', allowedRoles);

            if (!req.user) {
                console.log('No user found - checking if token exists');

                // Try to authenticate from token
                if (req.headers.authorization) {
                    console.log('Token exists, trying to authenticate...');
                    const decodedResult = decodeToken(req.headers.authorization);

                    if (decodedResult) {
                        const userData = await getUser(decodedResult.userId);
                        if (userData && !userData.isSuspended) {
                            req.user = userData;
                            console.log('User authenticated from token:', req.user.email);
                        }
                    }
                }

                // Still no user? Then fail
                if (!req.user) {
                    console.log('Still no user after token check');
                    return sendErrorResponse({
                        res,
                        status: httpStatus.UNAUTHORIZED,
                        msg: "Authentication required."
                    });
                }
            }

            console.log('User found:', req.user.email);
            console.log('User roles:', req.user.roles);

            // SUPERADMIN has access to everything
            if (req.user.roles.includes('SUPERADMIN')) {
                return next();
            }

            // Check if user has any of the allowed roles
            const hasAccess = req.user.roles.some(role => allowedRoles.includes(role));
            
            if (!hasAccess) {
                return sendErrorResponse({ 
                    res, 
                    status: httpStatus.FORBIDDEN, 
                    msg: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
                });
            }

            // Additional checks for specific roles
            if (allowedRoles.includes('LECTURER')) {
                const lecturer = await getLecturer(req.user._id);
                if (!lecturer || lecturer.requestStatus !== 'approved' || !lecturer.isActive) {
                    return sendErrorResponse({ 
                        res, 
                        status: httpStatus.FORBIDDEN, 
                        msg: "Your lecturer account is not approved or is inactive." 
                    });
                }
                req.lecturer = lecturer;
            }

            next();
        } catch (error) {
            console.error('Role verification error:', error.message);
            return sendErrorResponse({ 
                res, 
                status: httpStatus.INTERNAL_SERVER_ERROR, 
                msg: "Authorization failed." 
            });
        }
    };
};

// Test endpoint to verify auth is working
module.exports.testAuth = async (req, res) => {
    try {
        console.log('=== Testing Authentication ===');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        
        if (!req.headers.authorization) {
            return res.status(200).json({
                success: true,
                msg: "No authorization header",
                user: null
            });
        }
        
        const token = req.headers.authorization.split(' ')[1];
        console.log('Token:', token ? `${token.substring(0, 20)}...` : 'No token');
        
        const decoded = decodeToken(req.headers.authorization);
        console.log('Decoded:', decoded);
        
        if (decoded) {
            const user = await getUser(decoded.userId);
            return res.status(200).json({
                success: true,
                msg: "Token decoded successfully",
                decoded,
                user,
                reqUser: req.user
            });
        }
        
        return res.status(200).json({
            success: false,
            msg: "Token decode failed",
            decoded: null,
            user: null
        });
    } catch (error) {
        console.error('Test auth error:', error);
        return res.status(500).json({
            success: false,
            msg: "Test failed",
            error: error.message
        });
    }
};