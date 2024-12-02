const { sequelize } = require("../config/db");
const schemas = require("../config/schema");
const bcrypt = require("bcrypt");

const initializeAdminAccount = async () => {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existingAdmin = await schemas.Store.findOne({
        where: { username: adminUsername },
    });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await schemas.Store.create({
            name: "Administrator",
            username: adminUsername,
            password: hashedPassword,
            role: "ADMIN",
            is_active: true,
        });
        console.log(`Admin account created with username: ${adminUsername}`);
    } else {
        console.log("Admin account already exists.");
    }
};

// 데이터베이스 초기화
const initialDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connection established.");
        await sequelize.sync();
        console.log("Database synchronized.");
        await initializeAdminAccount();
    } catch (error) {
        console.error("Database initialization failed:", error.message);
        throw error;
    }
};

module.exports = { ...schemas, initialDatabase };
