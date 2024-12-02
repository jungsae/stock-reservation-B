const { Cake } = require("../config/schema");

class CakeDao {
    static async findAll() {
        return await Cake.findAll();
    }

    static async findById(id) {
        return await Cake.findByPk(id);
    }

    static async create(data) {
        return await Cake.create(data);
    }

    static async findByName(name) {
        return await Cake.findOne({ where: { name } });
    }

    static async update(id, data) {
        return await Cake.update(data, { where: { id } });
    }

    static async delete(id) {
        return await Cake.destroy({ where: { id } });
    }
}

module.exports = CakeDao;