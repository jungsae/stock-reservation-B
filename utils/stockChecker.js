const CustomError = require("../middlewares/CustomError");
const StoreCakeDao = require("../models/StoreCakeDao");

const checkAndUpdateStock = async (store_id, cakeChanges) => {
    for (const [cake_id, { difference }] of cakeChanges.entries()) {
        const storeCake = await StoreCakeDao.findByStoreAndCake(store_id, cake_id);
        if (!storeCake) {
            throw new CustomError(`Cake ${cake_id}는 매장에 존재하지 않습니다.`, 'CAKE_NOT_FOUND', 404);
        }

        const newStock = storeCake.stock - difference;
        if (newStock < 0) {
            throw new CustomError(
                `재고가 충분하지 않습니다! 재고: ${storeCake.stock}, 요청수량: ${difference}`,
                'STOCK_INSUFFICIENT',
                400
            );
        }

        await StoreCakeDao.updateStock(storeCake.id, newStock);
    }
};

module.exports = { checkAndUpdateStock };