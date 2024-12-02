const adminMiddleware = (req, res, next) => {
    if (req.role !== "ADMIN") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};

module.exports = adminMiddleware;
