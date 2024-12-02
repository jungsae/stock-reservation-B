const { Reservation, ReservationCake, Cake } = require("../config/schema");

class ReservationDao {
    static async findAll() {
        return await Reservation.findAll({
            include: [
                {
                    model: Cake,
                    as: "cakes",
                    attributes: { exclude: ["updatedAt"] },
                },
            ],
            attributes: { exclude: ["updatedAt"] },
        });
    }

    static async findFiltered(whereCondition) {
        return await Reservation.findAll({
            where: whereCondition,
            include: [
                {
                    model: Cake,
                    as: "cakes",
                    attributes: { exclude: ["updatedAt", "createdAt"] },
                    through: {
                        attributes: ["quantity"],
                    },
                },
            ],
            attributes: { exclude: ["updatedAt", "createdAt"] },
        });
    }

    static async findByStoreId(store_id) {
        return await Reservation.findAll({
            where: { store_id },
            include: [
                {
                    model: Cake,
                    as: "cakes",
                    attributes: { exclude: ["createdAt", "updatedAt"] }, // Cake 테이블의 createdAt, updatedAt 제외
                    through: {
                        model: ReservationCake,
                        as: "ReservationCake",
                        attributes: { exclude: ["createdAt", "updatedAt"] }, // ReservationCake 테이블의 createdAt, updatedAt 제외
                    },
                },
            ],
            attributes: { exclude: ["createdAt", "updatedAt"] }, // Reservation 테이블의 createdAt, updatedAt 제외
        });
    }


    static async findById(id) {
        return await Reservation.findByPk(id, {
            attributes: { exclude: ["updatedAt"] },
        });
    }

    static async findWithCakes(id) {
        return await Reservation.findByPk(id, {
            include: [
                {
                    model: Cake,
                    as: "cakes",
                    attributes: { exclude: ["updatedAt"] },
                },
            ],
            attributes: { exclude: ["updatedAt"] },
        });
    }

    static async create(data) {
        return await Reservation.create(data, {
            attributes: { exclude: ["updatedAt"] },
        });
    }

    static async updatePickupStatus(id, status) {
        const reservation = await this.findById(id);
        if (!reservation) {
            throw new Error(`Reservation with ID ${id} not found`);
        }
        reservation.pickup_status = status;
        return await reservation.save();
    }

    static async delete(id) {
        return await Reservation.destroy({ where: { id } });
    }
}

module.exports = ReservationDao;
