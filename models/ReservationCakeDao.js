const { ReservationCake } = require("../config/schema");

class ReservationCakeDao {
    static async create(data) {
        return await ReservationCake.create(data);
    }

    static async update(reservationCakeId, data) {
        return await ReservationCake.update(data, { where: { id: reservationCakeId } });
    }

    static async delete(reservationCakeId) {
        return await ReservationCake.destroy({ where: { id: reservationCakeId } });
    }

    static async deleteByReservationId(reservation_id) {
        return await ReservationCake.destroy({ where: { reservation_id } });
    }
}

module.exports = ReservationCakeDao;
