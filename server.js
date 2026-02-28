const express = require("express");
const path = require("path");
const moment = require("moment");
const morgan = require("morgan");
const http = require("http");
require("dotenv").config();
console.log('Zoom Account ID:', process.env.ZOOM_ACCOUNT_ID);
console.log('Zoom Client ID:', process.env.ZOOM_CLIENT_ID);
const mongodb = require("./configs/mongodb");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./configs/swagger");
const session = require("express-session");
const passport = require("passport");
const createSuperAdmin = require("./utils/createSuperAdmin");
const seedTestimonials = require("./utils/seedTestimonials");
const seedCourses = require("./utils/seedCourses");
const seedFeatures = require("./utils/seedFeatures");

// Socket.IO and Firebase
const { initializeSocket } = require("./socket/socketManager");
const { initializeFirebase } = require("./configs/firebase");
const { publishScheduledAnnouncements } = require("./controllers/announcement.controller");
const { initializeAgenda, getAgenda } = require("./jobs/agenda");
// Start app
const app = express();

// Logging
app.use(morgan("dev"));

// Request body limit
app.use(express.json({ limit: "50mb" }));
app.use(
    express.urlencoded({
        extended: false,
        limit: "50mb",
    })
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Static files
app.use(express.static(path.join(__dirname, "")));

// Sessions
app.use(
    session({
        resave: false,
        saveUninitialized: true,
        secret: process.env.SESSION_SECRET || "SECRET",
    })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// CORS
require("./requires/cors")(app);

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Neplearns API Docs"
}));

// All routes
app.use(require("./requires/allRoutes"));

// Create server
const server = http.createServer(app);

// Connect DB, then create SUPERADMIN, then start server
mongodb().then(async () => {
    // Create SUPERADMIN after DB is ready
    await createSuperAdmin();

    // Seed testimonials (runs only once)
    await seedTestimonials();

    // Seed courses (runs only once)
    await seedCourses();

    // Seed features (runs only once)
    await seedFeatures();

    // Initialize Firebase Admin SDK
    initializeFirebase();

    // Initialize Socket.IO
    initializeSocket(server);

    // Initialize Agenda job scheduler (requires MongoDB replica set)
    // Temporarily disabled - uncomment when replica set is configured
    // const agenda = await initializeAgenda();
    // await agenda.start();
    // await agenda.every('0 0 * * *', 'generate-upcoming-sessions');
    // console.log('Agenda job scheduler started');
    console.log('⚠️  Agenda disabled (requires MongoDB replica set)');

    server.listen(process.env.PORT, () => {
        console.log("========================================");
        console.log(
            `🚀 Server Running at http://localhost:${process.env.PORT}`
        );
        console.log("========================================");

        // Check for scheduled announcements every minute
        setInterval(publishScheduledAnnouncements, 60 * 1000);
    });
}).catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
});

module.exports = app;
