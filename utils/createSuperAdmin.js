const User = require("../models/user.model");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

function genPassword(password) {
    const salt = crypto.randomBytes(32).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return { salt, hash };
}

async function createSuperAdmin() {
    const existingAdmin = await User.findOne({ roles: "SUPERADMIN" });
    if (existingAdmin) return console.log("✔ SUPERADMIN already exists.");

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, salt);

    const newAdmin = new User({
        firstname: process.env.SUPERADMIN_FIRSTNAME,
        lastname: process.env.SUPERADMIN_LASTNAME,
        email: process.env.SUPERADMIN_EMAIL,
        phone: process.env.SUPERADMIN_CONTACT,
        roles: ["SUPERADMIN"],
        isVerified: true,
        verificationCode: 0,
        salt,
        hash,
    });

    await newAdmin.save();
    console.log("SUPERADMIN created successfully!");
}

module.exports = createSuperAdmin;
