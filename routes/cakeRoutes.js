const express = require("express");
const CakeController = require("../controllers/cakeController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, CakeController.getAll);
router.get("/:id", authMiddleware, adminMiddleware, CakeController.getOne);
router.post("/", authMiddleware, adminMiddleware, CakeController.create);
router.put("/:id", authMiddleware, adminMiddleware, CakeController.update);
router.delete("/:id", authMiddleware, adminMiddleware, CakeController.delete);

module.exports = router;
