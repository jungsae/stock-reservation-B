const CustomError = require("../middlewares/CustomError");
const StoreCakeDao = require("../models/StoreCakeDao");
const { sendNotification } = require('../routes/notification');
const CakeDao = require("../models/CakeDao");  // 케이크 정보를 가져오기 위해 추가

class storeCakeService {
    // 모든 케이크 재고 상태 조회 (ADMIN 전용)
    static async getAllCakes() {
        return await StoreCakeDao.findAll();
    }

    // 특정 매장의 케이크 조회 (USER 전용)
    static async getCakesByStore(store_id) {
        if (!store_id) {
            throw new CustomError("Store ID is required", 400);
        }

        return await StoreCakeDao.findByStoreId(store_id);
    }

    // 케이크 재고 필터링
    static async filterStoreCakes(store_id, filters) {
        const { stockStatus } = filters;

        const whereConditions = {};

        if (store_id) whereConditions.store_id = store_id;
        if (stockStatus) {
            whereConditions.stock = stockStatus === "low" ? { $lte: 5 } : { $gt: 5 };
        }

        return await StoreCakeDao.findAllWithFilters(whereConditions);
    }

    // 특정 케이크 조회
    static async getCakeById(cake_id) {
        const cake = await StoreCakeDao.findById(cake_id);
        if (!cake) {
            throw new CustomError(`Cake with id ${cake_id} not found`, 404);
        }

        return cake;
    }

    // 케이크 재고 생성
    static async createCake(store_id, data) {
        if (!store_id) {
            throw new CustomError("Store ID is required", 400);
        }

        const { cake_id, stock } = data;

        if (!cake_id || stock == null) {
            throw new CustomError("Cake ID and stock are required", 400);
        }

        const existingEntry = await StoreCakeDao.findByStoreAndCake(store_id, cake_id);
        if (existingEntry) {
            throw new CustomError("This cake is already registered for the store", 409);
        }

        const stock_data = {
            store_id,
            cake_id,
            stock,
        };

        await StoreCakeDao.create(stock_data);

        return {
            message: `stock has updated!`
        }
    }

    // 케이크 재고 수정
    static async updateStock(store_id, store_cake_id, stock) {
        const storeCake = await StoreCakeDao.findById(store_cake_id);

        if (!storeCake) {
            throw new CustomError("해당 케이크가 존재하지 않습니다.", "CAKE_NOT_FOUND", 404);
        }

        if (stock < 0) {
            throw new CustomError("재고는 0 이상이어야 합니다.", "INVALID_STOCK", 400);
        }

        if (storeCake.store_id !== store_id) {
            throw new CustomError("해당 케이크를 수정할 권한이 없습니다.", "FORBIDDEN", 403);
        }

        const updatedStoreCake = await StoreCakeDao.update(store_cake_id, { stock });

        // 업데이트된 케이크의 최종 재고가 0이면 SSE 알림 전송
        if (updatedStoreCake.stock == 0 || stock == 0) {
            const cakeInfo = await CakeDao.findById(storeCake.cake_id);
            sendNotification({
                cakeId: cakeInfo.id,
                cakeName: cakeInfo.name,
                type: "STOCK_EMPTY",
                message: `${cakeInfo.name} 케이크 재고가 소진되었습니다.`
            });
        }

        return updatedStoreCake;
    }

    // 케이크 재고 삭제
    static async deleteCake(store_id, store_cake_id) {
        const storeCake = await StoreCakeDao.findById(store_cake_id);

        if (!storeCake) {
            throw { status: 404, message: `StoreCake with id ${store_cake_id} not found` };
        }

        if (storeCake.store_id !== store_id) {
            throw { status: 403, message: "You are not authorized to delete this cake" };
        }

        // 케이크 삭제
        return await StoreCakeDao.delete(store_cake_id);
    }
}

module.exports = storeCakeService;