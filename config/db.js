const { Sequelize } = require("sequelize");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

// 데이터베이스 경로 설정
const dbPath = path.resolve(process.env.DATABASE_URL || "./data/database.sqlite");

// 데이터베이스 디렉토리 확인 및 생성
try {
    const dbDir = path.dirname(dbPath);
    if (fs.existsSync(dbDir)) {
        console.log(`Database directory already exists at: ${dbDir}`);
    } else {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`Database directory created at: ${dbDir}`);
    }
} catch (error) {
    console.error("Failed to create or verify database directory:", error.message);
    process.exit(1);
}

// Sequelize 인스턴스 생성
const isProduction = process.env.NODE_ENV === "production";
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: dbPath,
    // logging: isProduction ? false : console.log, // 개발 환경에서만 로그 활성화
    logging: false,
});

// 데이터베이스 연결 함수
const connectDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connection established successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error.message);
        throw error;
    }
};

module.exports = { sequelize, connectDatabase };
