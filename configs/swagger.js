const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NepLearns API',
      version: '1.0.0',
      description: 'E-learning platform API documentation',
      contact: {
        name: 'NepLearns Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'User ID' },
            name: { type: 'string', description: 'User full name' },
            email: { type: 'string', format: 'email', description: 'User email' },
            role: {
              type: 'string',
              enum: ['LEARNER', 'LECTURER', 'ADMIN', 'SUPERADMIN'],
              description: 'User role'
            },
            isVerified: { type: 'boolean', description: 'Email verification status' },
            avatar: { type: 'string', description: 'User avatar URL' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Course ID' },
            title: { type: 'string', description: 'Course title' },
            slug: { type: 'string', description: 'URL-friendly course identifier' },
            description: { type: 'string', description: 'Course description' },
            thumbnail: { type: 'string', description: 'Course thumbnail URL' },
            price: { type: 'number', description: 'Course price' },
            isPublished: { type: 'boolean', description: 'Publication status' },
            lecturers: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
              description: 'Course lecturers'
            },
          },
        },
        Enquiry: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            level: {
              type: 'string',
              enum: ['see', 'plus2-science', 'plus2-management', 'plus2-humanities', 'other']
            },
            message: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'contacted', 'resolved', 'rejected']
            },
          },
        },
        Newsletter: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            msg: { type: 'string', description: 'Error message' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            msg: { type: 'string', description: 'Success message' },
            data: { type: 'object', description: 'Response data' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Courses', description: 'Course management endpoints' },
      { name: 'Enquiry', description: 'Student enquiry endpoints' },
      { name: 'Newsletter', description: 'Newsletter subscription endpoints' },
      { name: 'Verification', description: 'Lecturer verification endpoints' },
      { name: 'Lecturers', description: 'Public lecturer endpoints' },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
