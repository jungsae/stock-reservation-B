const express = require("express");
const router = express.Router();

const storeCakeRoutes = require("./storeCakeRoutes");
const storeRoutes = require("./storeRoutes");
const reservationRoutes = require("./reservationRoutes");
const cakeRoutes = require("./cakeRoutes");

router.use("/storeCakes", storeCakeRoutes);
router.use("/stores", storeRoutes);
router.use("/reservations", reservationRoutes);
router.use("/cakes", cakeRoutes);

module.exports = router;