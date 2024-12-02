const ReservationService = require("../services/reservationService");

class ReservationController {
    static async getAll(req, res) {
        try {
            if (req.role !== "ADMIN") {
                return res.status(403).json({ message: "Forbidden: Admin access only" });
            }
            const reservations = await ReservationService.getAllReservations();
            res.json(reservations);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getStoreReservations(req, res) {
        try {
            const reservations = await ReservationService.getReservationsByStore(req.store_id);
            res.json(reservations);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async filterReservations(req, res) {
        try {
            const filters = req.query; // 필터 조건은 쿼리 파라미터로
            const store_id = req.role === "ADMIN" ? null : req.store_id; // 관리자면 모든 매장 조회 가능

            const reservations = await ReservationService.filterReservations(store_id, filters);
            res.json(reservations);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const reservation = await ReservationService.createReservation(req.store_id, req.body);
            res.status(201).json(reservation);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async updatePickupStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!["pending", "picked_up", "cancelled"].includes(status)) {
                return res.status(400).json({ message: "Invalid pickup status" });
            }

            const updatedReservation = await ReservationService.updatePickupStatus(id, status);
            res.json(updatedReservation);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async updateReservation(req, res) {
        try {
            const store_id = req.store_id;
            const reservation_id = req.params.id;
            const data = req.body;

            if (!data || Object.keys(data).length === 0) {
                return res.status(400).json({ message: "No changes provided" });
            }

            const updatedReservation = await ReservationService.updateReservation(
                store_id,
                reservation_id,
                data
            );

            res.json(updatedReservation);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { store_id } = req;
            const { id } = req.params;

            await ReservationService.deleteReservation(store_id, id);
            res.status(204).end();
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}

module.exports = ReservationController;
