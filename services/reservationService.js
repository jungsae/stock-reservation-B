const ReservationDao = require("../models/ReservationDao");
const ReservationCakeDao = require("../models/ReservationCakeDao");
const StoreCakeDao = require("../models/StoreCakeDao");
const { checkAndUpdateStock } = require("../utils/stockChecker")
const { Op } = require("sequelize");

class ReservationService {
    static async getAllReservations() {
        return await ReservationDao.findAll();
    }

    static async getReservationsByStore(store_id) {
        if (!store_id) {
            throw new Error("Store ID is required");
        }
        return await ReservationDao.findByStoreId(store_id);
    }

    static async filterReservations(store_id, filters) {
        const { status, startDate, endDate, startTime, endTime, customer_name } = filters;

        const whereCondition = { store_id };

        if (status) whereCondition.pickup_status = status;

        if (startDate && endDate) {
            whereCondition.pickup_date = {
                [Op.between]: [new Date(startDate), new Date(endDate)],
            };
        } else if (startDate) {
            whereCondition.pickup_date = { [Op.gte]: new Date(startDate) };
        } else if (endDate) {
            whereCondition.pickup_date = { [Op.lte]: new Date(endDate) };
        }

        if (startTime && endTime) {
            whereCondition.pickup_time = {
                [Op.between]: [startTime, endTime],
            };
        } else if (startTime) {
            whereCondition.pickup_time = { [Op.gte]: startTime };
        } else if (endTime) {
            whereCondition.pickup_time = { [Op.lte]: endTime };
        }

        if (customer_name) {
            whereCondition.customer_name = { [Op.like]: `%${customer_name}%` };
        }

        return await ReservationDao.findFiltered(whereCondition);
    }

    static async createReservation(store_id, data) {
        const { customer_name, customer_phone, pickup_date, pickup_time, cakes, total_price } = data;

        if (!cakes || cakes.length === 0) {
            throw new Error("Cakes are required for reservation");
        }

        const cakeChanges = new Map();

        for (const cake of cakes) {
            cakeChanges.set(cake.id, { difference: cake.quantity });
        }

        await checkAndUpdateStock(store_id, cakeChanges);

        const reservation = await ReservationDao.create({
            customer_name,
            customer_phone,
            store_id,
            pickup_date,
            pickup_time,
            total_price,
        });

        for (const cake of cakes) {
            await ReservationCakeDao.create({
                reservation_id: reservation.id,
                cake_id: cake.id,
                quantity: cake.quantity,
            });
        }

        return reservation;
    }

    static async updatePickupStatus(reservation_id, status) {
        const reservation = await ReservationDao.findById(reservation_id);
        if (!reservation) {
            throw new Error(`Reservation with ID ${reservation_id} not found`);
        }

        return await ReservationDao.updatePickupStatus(reservation_id, status);
    }

    static async updateReservation(store_id, reservation_id, data) {
        const { customer_name, customer_phone, total_price, pickup_date, pickup_time, cakes } = data;

        const reservation = await ReservationDao.findWithCakes(reservation_id);
        if (!reservation || reservation.store_id !== store_id) {
            throw new Error("Reservation not found or unauthorized access");
        }

        const cakeChanges = new Map();

        if (cakes) {
            const existingCakes = reservation.cakes;

            for (const newCake of cakes) {
                const existingCake = existingCakes.find((cake) => cake.id === newCake.id);
                const newQuantity = newCake.quantity;

                if (existingCake) {
                    const oldQuantity = existingCake.ReservationCake.quantity;
                    const difference = newQuantity - oldQuantity;
                    cakeChanges.set(newCake.id, { newQuantity, difference, oldQuantity });
                } else {
                    cakeChanges.set(newCake.id, { newQuantity, difference: newQuantity, oldQuantity: 0 });
                }
            }

            // 재고 확인 및 업데이트
            await checkAndUpdateStock(store_id, cakeChanges);

            for (const [cake_id, { newQuantity, oldQuantity }] of cakeChanges.entries()) {
                const existingCake = reservation.cakes.find((cake) => cake.id === cake_id);

                if (existingCake) {
                    await ReservationCakeDao.update(existingCake.ReservationCake.id, { quantity: newQuantity });
                } else {
                    await ReservationCakeDao.create({
                        reservation_id,
                        cake_id,
                        quantity: newQuantity,
                    });
                }
            }

            for (const existingCake of reservation.cakes) {
                const isRemoved = !cakes.find((cake) => cake.id === existingCake.id);
                if (isRemoved) {
                    await ReservationCakeDao.delete(existingCake.ReservationCake.id);
                    const storeCake = await StoreCakeDao.findByStoreAndCake(store_id, existingCake.id);
                    await StoreCakeDao.updateStock(
                        storeCake.id,
                        storeCake.stock + existingCake.ReservationCake.quantity
                    );
                }
            }
        }

        // 예약 정보 업데이트
        if (customer_name) reservation.customer_name = customer_name;
        if (customer_phone) reservation.customer_phone = customer_phone;
        if (pickup_date) reservation.pickup_date = pickup_date;
        if (pickup_time) reservation.pickup_time = pickup_time;
        if (total_price) reservation.total_price = total_price;

        await reservation.save();
        return await ReservationDao.findWithCakes(reservation_id);
    }


    static async deleteReservation(store_id, reservation_id) {
        const reservation = await ReservationDao.findWithCakes(reservation_id);

        if (!reservation || reservation.store_id !== store_id) {
            throw new Error(`Reservation with ID ${reservation_id} not found or unauthorized`);
        }

        // 재고 복구
        for (const cake of reservation.cakes) {
            const storeCake = await StoreCakeDao.findByStoreAndCake(store_id, cake.id);
            if (storeCake) {
                await StoreCakeDao.updateStock(
                    storeCake.id,
                    storeCake.stock + cake.ReservationCake.quantity
                );
            }
        }

        // 예약 및 연결 데이터 삭제
        // await ReservationCakeDao.deleteByReservationId(reservation_id);
        await ReservationDao.updatePickupStatus(reservation_id, "cancelled");
    }
}

module.exports = ReservationService;