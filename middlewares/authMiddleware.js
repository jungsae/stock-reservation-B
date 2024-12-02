const jwt = require("jsonwebtoken");
const { Store } = require("../config/schema"); // Store 모델 가져오기

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization token is required" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Bearer token is missing" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 데이터베이스에서 사용자 상태 확인
        const store = await Store.findByPk(decoded.store_id);
        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }

        if (!store.is_active) {
            return res.status(403).json({ message: "Account is inactive" });
        }

        req.store_id = decoded.store_id; // 매장 ID
        req.role = decoded.role;         // 사용자 역할

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired" });
        } else if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        } else {
            return res.status(500).json({ message: "Internal server error during token verification" });
        }
    }
};

module.exports = authMiddleware;
