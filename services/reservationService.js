const ReservationDao = require("../models/ReservationDao");
const ReservationCakeDao = require("../models/ReservationCakeDao");
const StoreCakeDao = require("../models/StoreCakeDao");
const { checkAndUpdateStock } = require("../utils/stockChecker")
const { Op } = require("sequelize");
const CustomError = require("../middlewares/CustomError");
const { sendNotification } = require('../routes/notification');

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

    static async getCakeCountByReservation(cake_id, store_id) {
        return await ReservationDao.findByCakeId(cake_id, store_id);
    }

    static async filterReservations(store_id, filters) {
        const { status, startDate, endDate, startTime, endTime, customer_name, orderDateStart, orderDateEnd } = filters;

        const whereCondition = { store_id };

        if (status) whereCondition.pickup_status = status;

        if (startDate && endDate) {
            whereCondition.pickup_date = {
                [Op.between]: [
                    new Date(`${startDate}T00:00:00Z`),
                    new Date(`${endDate}T23:59:59Z`),
                ],
            };
        } else if (startDate) {
            whereCondition.pickup_date = { [Op.gte]: new Date(startDate) };
        } else if (endDate) {
            whereCondition.pickup_date = { [Op.lte]: new Date(endDate) };
        }

        if (orderDateStart && orderDateEnd) {
            whereCondition.order_date = {
                [Op.between]: [
                    new Date(`${orderDateStart}T00:00:00Z`),
                    new Date(`${orderDateEnd}T23:59:59Z`),
                ],
            };
        } else if (orderDateStart) {
            whereCondition.order_date = { [Op.gte]: new Date(orderDateStart) };
        } else if (orderDateEnd) {
            whereCondition.order_date = { [Op.lte]: new Date(orderDateEnd) };
        }

        if (startTime || endTime) {
            const normalizeTime = (time) => {
                if (!time) return time;
                const [hours, minutes] = time.split(':');
                return parseInt(hours) * 60 + parseInt(minutes);
            };

            if (startTime && endTime) {
                whereCondition.pickup_time = sequelize.where(
                    sequelize.literal(`
                        (CAST(substr(pickup_time, 1, instr(pickup_time, ':') - 1) AS INTEGER) * 60 + 
                        CAST(substr(pickup_time, instr(pickup_time, ':') + 1) AS INTEGER))
                    `),
                    {
                        [Op.between]: [normalizeTime(startTime), normalizeTime(endTime)]
                    }
                );
            } else if (startTime) {
                whereCondition.pickup_time = sequelize.where(
                    sequelize.literal(`
                        (CAST(substr(pickup_time, 1, instr(pickup_time, ':') - 1) AS INTEGER) * 60 + 
                        CAST(substr(pickup_time, instr(pickup_time, ':') + 1) AS INTEGER))
                    `),
                    {
                        [Op.gte]: normalizeTime(startTime)
                    }
                );
            } else if (endTime) {
                whereCondition.pickup_time = sequelize.where(
                    sequelize.literal(`
                        (CAST(substr(pickup_time, 1, instr(pickup_time, ':') - 1) AS INTEGER) * 60 + 
                        CAST(substr(pickup_time, instr(pickup_time, ':') + 1) AS INTEGER))
                    `),
                    {
                        [Op.lte]: normalizeTime(endTime)
                    }
                );
            }
        }

        if (customer_name) {
            whereCondition.customer_name = { [Op.like]: `%${customer_name}%` };
        }

        return await ReservationDao.findFiltered(whereCondition);
    }

    static async createReservation(store_id, data) {
        const { customer_name, customer_phone, pickup_date, pickup_time, cakes, supplies, request, order_date } = data;

        if (!cakes || cakes.length === 0) {
            throw new CustomError("Cakes are required for reservation", "CAKES_REQUIRED", 400);
        }

        try {
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
                order_date,
                supplies,
                request,
            });

            for (const cake of cakes) {
                await ReservationCakeDao.create({
                    reservation_id: reservation.id,
                    cake_id: cake.id,
                    quantity: cake.quantity,
                });
            }

            // 모든 업데이트가 완료된 후 재고가 0인 케이크들에 대해 SSE 알림 전송
            const allStoreCakes = await StoreCakeDao.findByStoreId(store_id);
            for (const storeCake of allStoreCakes) {
                if (storeCake.stock == 0) {
                    sendNotification({
                        cake_id: storeCake.cake_id,
                        cakeName: storeCake.cakeInfo.name,
                        type: "STOCK_EMPTY",
                        message: `${storeCake.cakeInfo.name} 케이크 재고가 소진되었습니다.`
                    });
                }
            }

            return { reservation };

        } catch (error) {
            if (!(error instanceof CustomError)) {
                throw new CustomError(error.message, "INTERNAL_SERVER_ERROR", 500);
            }
            throw error;
        }
    }

    static async updatePickupStatus(reservation_id, status) {
        const reservation = await ReservationDao.findById(reservation_id);
        if (!reservation) {
            throw new Error(`Reservation with ID ${reservation_id} not found`);
        }
        return await ReservationDao.updatePickupStatus(reservation_id, status);
    }

    static async updateReservation(store_id, reservation_id, data) {
        const { customer_name, customer_phone, pickup_date, pickup_time, cakes, supplies, request, order_date } = data;

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

        if (customer_name) reservation.customer_name = customer_name;
        if (customer_phone) reservation.customer_phone = customer_phone;
        if (pickup_date) reservation.pickup_date = pickup_date;
        if (pickup_time) reservation.pickup_time = pickup_time;
        if (order_date) reservation.order_date = order_date; // 주문 날짜 업데이트
        if (supplies) reservation.supplies = supplies; // 부자재 업데이트
        if (request) reservation.request = request; // 요청사항 업데이트

        await reservation.save();

        // 모든 업데이트가 완료된 후 재고가 0인 케이크들에 대해 SSE 알림 전송
        const allStoreCakesWithZero = await StoreCakeDao.findByStoreId(store_id);
        const filteredWithZero = allStoreCakesWithZero.filter(storeCake => storeCake.stock == 0);
        for (const storeCake of filteredWithZero) {
            sendNotification({
                cake_id: storeCake.cake_id,
                cakeName: storeCake.cakeInfo.name,
                type: "STOCK_EMPTY",
                message: `${storeCake.cakeInfo.name} 케이크 재고가 소진되었습니다.`
            });
        }

        const updatedReservation = await ReservationDao.findWithCakes(reservation_id);
        return { reservation: updatedReservation };
    }

    static async deleteReservation(store_id, reservation_id) {
        const reservation = await ReservationDao.findWithCakes(reservation_id);

        if (reservation.pickup_status === 'cancelled') {
            throw new Error(`이미 취소된 예약입니다!`)
        }

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