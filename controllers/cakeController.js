const CakeService = require("../services/cakeService");

class CakeController {
    static async getAll(req, res) {
        try {
            const cakes = await CakeService.getAll();
            res.json(cakes);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getOne(req, res) {
        try {
            const cake = await CakeService.getOne(req.params.id);
            if (!cake) return res.status(404).json({ message: "Cake not found" });
            res.json(cake);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async create(req, res) {
        try {
            const newCake = await CakeService.create(req.body);
            res.status(201).json(newCake);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const updatedCake = await CakeService.update(req.params.id, req.body);
            res.json(updatedCake);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            await CakeService.delete(req.params.id, req.role);
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = CakeController;