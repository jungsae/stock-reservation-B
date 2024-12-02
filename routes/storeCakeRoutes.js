const express = require("express");
const storeCakeController = require("../controllers/storeCakeController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, storeCakeController.getAll);
router.get("/storeCakes", authMiddleware, storeCakeController.filterStoreCakes);
router.post("/", authMiddleware, storeCakeController.create);
router.put("/:id", authMiddleware, storeCakeController.update);
router.delete("/:id", authMiddleware, storeCakeController.delete);

module.exports = router;
