const StoreCakeDao = require("../models/StoreCakeDao");

const checkAndUpdateStock = async (store_id, cakeChanges) => {
    for (const [cake_id, { difference }] of cakeChanges.entries()) {
        const storeCake = await StoreCakeDao.findByStoreAndCake(store_id, cake_id);
        if (!storeCake) {
            throw new Error(`Cake with ID ${cake_id} not found in store inventory`);
        }

        const newStock = storeCake.stock - difference;
        if (newStock < 0) {
            throw new Error(
                `Not enough stock for cake ID ${cake_id}. Available: ${storeCake.stock}, Requested: ${difference}`
            );
        }

        await StoreCakeDao.updateStock(storeCake.id, newStock);
    }
};

module.exports = { checkAndUpdateStock };