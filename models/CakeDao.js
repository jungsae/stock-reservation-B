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

    static async delete(id, options = {}) {
        // ID 값 검증
        if (typeof id !== "number" || isNaN(id)) {
            throw new Error("Invalid ID provided for deletion");
        }

        // 삭제 작업
        return await Cake.destroy({
            where: { id }, // ID 조건
            ...options, // 추가 옵션
        });
    }
}

module.exports = CakeDao;