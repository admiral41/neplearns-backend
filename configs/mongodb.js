const mongoose = require("mongoose");
const { DB_TO_USE } = require("../constants/_db");

module.exports = async () => {
    try {
        mongoose.Promise = global.Promise;
        await mongoose.connect(DB_TO_USE);
        console.log("📦 MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err.message);
        process.exit(1);
    }
};
