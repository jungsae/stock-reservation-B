const express = require("express");
const StoreController = require("../controllers/storeController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// router.get("/", adminMiddleware, StoreController.getAll);
// router.get("/:id", authMiddleware, StoreController.getOne);
router.get("/", authMiddleware, StoreController.getStores);
router.post("/login", StoreController.login)
router.post("/signup", StoreController.create)
router.put("/:id", StoreController.update);
router.delete("/deactivate", authMiddleware, StoreController.deactivate);
router.delete("/:id", authMiddleware, adminMiddleware, StoreController.delete);

module.exports = router;