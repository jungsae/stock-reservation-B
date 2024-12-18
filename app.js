const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const { initialDatabase } = require("./models")
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/ping", (req, res) => res.json({ message: "pong" }));

app.use(routes);

app.use(errorHandler);

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
        process.exit(1);
    });

process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down...');
    process.exit(0);
});
