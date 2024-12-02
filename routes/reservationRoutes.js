const express = require("express");
const ReservationController = require("../controllers/reservationController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 예약 전체 조회 (관리자 전용)
router.get("/", authMiddleware, ReservationController.getAll);
// 특정 매장의 예약 조회 (USER 전용)
router.get("/store", authMiddleware, ReservationController.getStoreReservations);
router.get("/sort", authMiddleware, ReservationController.filterReservations);

router.post("/", authMiddleware, ReservationController.create);
router.patch("/:id/pickup-status", authMiddleware, ReservationController.updatePickupStatus);
router.patch("/:id", authMiddleware, ReservationController.updateReservation);
router.delete("/:id", authMiddleware, ReservationController.delete);

module.exports = router;