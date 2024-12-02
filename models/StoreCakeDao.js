const { Cake, StoreCake } = require("../config/schema");

class StoreCakeDao {
    static async findAll() {
        return await StoreCake.findAll({
            include: [
                {
                    model: Cake,
                    as: "cakeInfo",
                    attributes: { exclude: ["updatedAt"] },
                },
            ],
            attributes: { exclude: ["updatedAt"] },
        });
    }

    static async findByStoreId(store_id) {
        return await StoreCake.findAll({
            where: { store_id },
            include: [
                {
                    model: Cake,
                    as: "cakeInfo",
                    attributes: { exclude: ["updatedAt"] },
                },
            ],
            attributes: { exclude: ["updatedAt"] },
        });
    }

    static async findById(cake_id) {
        return await StoreCake.findByPk(cake_id, {
            include: [
                {
                    model: Cake,
                    as: "cakeInfo",
                    attributes: { exclude: ["updatedAt"] },
                },
            ],
            attributes: { exclude: ["updatedAt"] },
        });
    }

    static async findByStoreAndCake(store_id, cake_id) {
        return await StoreCake.findOne({
            where: { store_id, cake_id },
            attributes: { exclude: ["updatedAt"] },
        });
    }

    static async findAllWithFilters(whereConditions) {
        return await StoreCake.findAll({
            where: whereConditions,
            include: [
                {
                    model: Cake,
                    as: "cakeInfo",
                    attributes: ["id", "name", "price", "description", "image_url"],
                },
            ],
            attributes: { exclude: ["updatedAt"] },
        });
    }

    static async create(data) {
        return await StoreCake.create(data);
    }

    static async update(cake_id, data) {
        return await StoreCake.update(data, { where: { id: cake_id } });
    }

    static async updateStock(id, newStock) {
        const storeCake = await StoreCake.findByPk(id, {
            attributes: { exclude: ["updatedAt"] },
        });
        if (!storeCake) {
            throw new Error(`StoreCake with ID ${id} not found`);
        }
        storeCake.stock = newStock;
        return await storeCake.save();
    }

    static async delete(cake_id) {
        return await StoreCake.destroy({ where: { id: cake_id } });
    }
}

module.exports = StoreCakeDao;