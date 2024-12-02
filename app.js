const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const { initialDatabase } = require("./models")
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/ping", (req, res) => res.json({ message: "pong" }));

app.use(routes);

const PORT = process.env.PORT || 3000;
initialDatabase()
    .then(() => {
        console.log("Database initialized successfully.");
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
        });
    })
    .catch((err) => {
        console.error("Failed to initialize database:", err);
        process.exit(1); // 데이터베이스 초기화 실패 시 서버 실행 중단
    });