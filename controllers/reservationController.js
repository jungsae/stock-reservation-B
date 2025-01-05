const ReservationService = require("../services/reservationService");
const CustomError = require('../middlewares/CustomError')

class ReservationController {
    static async getAll(req, res, next) {
        try {
            if (req.role !== "ADMIN") {
                throw new CustomError("Forbidden: Admin access only", "FORBIDDEN", 403);
            }
            const reservations = await ReservationService.getAllReservations();
            res.json(reservations);
        } catch (error) {
            next(error);
        }
    }

    static async getCakeCountByReservation(req, res, next) {
        try {
            const { id } = req.params;
            req.store_id = store_id;
            const cake = await ReservationService.getCakeCountByReservation(id, store_id);
            res.json({ cake });
        } catch (error) {
            next(error);
        }
    }

    static async getStoreReservations(req, res, next) {
        try {
            const reservations = await ReservationService.getReservationsByStore(req.store_id);
            res.json(reservations);
        } catch (error) {
            next(error);
        }
    }

    static async filterReservations(req, res, next) {
        try {
            const filters = req.query;
            const store_id = req.role === "ADMIN" ? null : req.store_id;

            const reservations = await ReservationService.filterReservations(store_id, filters);
            res.json(reservations);
        } catch (error) {
            next(error);
        }
    }

    static async create(req, res, next) {
        try {
            const reservation = await ReservationService.createReservation(req.store_id, req.body);
            res.status(201).json(reservation);
        } catch (error) {
            next(error);
        }
    }

    static async updatePickupStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!["pending", "picked_up", "cancelled"].includes(status)) {
                throw new CustomError("Invalid pickup status", "INVALID_STATUS", 400);
            }

            const updatedReservation = await ReservationService.updatePickupStatus(id, status);
            res.json(updatedReservation);
        } catch (error) {
            next(error);
        }
    }

    static async updateReservation(req, res, next) {
        try {
            const store_id = req.store_id;
            const reservation_id = req.params.id;
            const data = req.body;

            if (!data || Object.keys(data).length === 0) {
                throw new CustomError("No changes provided", "NO_CHANGES", 400);
            }

            const updatedReservation = await ReservationService.updateReservation(
                store_id,
                reservation_id,
                data
            );

            res.json(updatedReservation);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            const { store_id } = req;
            const { id } = req.params;

            await ReservationService.deleteReservation(store_id, id);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ReservationController;