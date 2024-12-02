const { Store } = require("../config/schema");

class StoreDao {
    static async findAll() {
        return await Store.findAll();
    }

    static async findById(id) {
        return await Store.findByPk(id);
    }

    static async findByUsername(username) {
        return await Store.findOne({ where: { username } });
    }

    static async create(data) {
        return await Store.create(data);
    }

    static async update(id, data) {
        return await Store.update(data, { where: { id } });
    }

    static async delete(id) {
        return await Store.destroy({ where: { id } });
    }
}

module.exports = StoreDao;
