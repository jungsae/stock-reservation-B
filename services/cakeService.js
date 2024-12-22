const { sequelize } = require("../config/db");
const CakeDao = require("../models/CakeDao");

class CakeService {
    static async getAll() {
        return await CakeDao.findAll();
    }

    static async getOne(id) {
        if (!id) {
            throw new Error("Cake ID is required");
        }

        return await CakeDao.findById(id);
    }

    static async create(data) {
        const { name, price, description, image_url } = data;

        if (!name || !price || !description || !image_url) {
            throw new Error("Name and price are required");
        }

        const existingCake = await CakeDao.findByName(name);
        if (existingCake) {
            throw new Error(`Cake with name "${name}" already exists`);
        }

        return await CakeDao.create(data);
    }

    static async update(id, data) {
        const cake = await CakeDao.findById(id);
        if (!cake) {
            throw new Error(`Cake with id ${id} not found`);
        }

        await CakeDao.update(id, data);
        return {
            message: "Data Updated!"
        }
    }

    static async delete(id, userRole) {
        const cake = await CakeDao.findById(id);
        if (!cake) {
            throw new Error(`Cake with id ${id} not found`);
        }

        if (userRole === "ADMIN") {
            const transaction = await sequelize.transaction();
            try {
                await sequelize.query('PRAGMA foreign_keys=OFF', { transaction });
                await CakeDao.delete({ where: { id }, transaction });
                await sequelize.query('PRAGMA foreign_keys=ON', { transaction });
                await transaction.commit();
            } catch (err) {
                await transaction.rollback();
                throw new Error(`Failed to delete Cake: ${err.message}`);
            }
        } else {
            throw new Error("Unauthorized deletion");
        }

        return { message: "Data Deleted!" };
    }
}

module.exports = CakeService;
