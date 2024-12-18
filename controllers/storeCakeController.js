const storeCakeService = require("../services/storeCakeService");
const CustomError = require("../middlewares/CustomError");

class storeCakeController {
    // 매장별 / 모든 케이크 가져오기
    static async getAll(req, res) {
        try {
            const { role, store_id } = req;

            // ADMIN은 모든 케이크 조회, USER는 자신의 매장 케이크만 조회
            const cakes = role === "ADMIN"
                ? await storeCakeService.getAllCakes()
                : await storeCakeService.getCakesByStore(store_id);

            res.json(cakes);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // 케이크 재고 필터링
    static async filterStoreCakes(req, res) {
        try {
            const filters = req.query;
            const store_id = req.role === "ADMIN" ? null : req.store_id;

            const storeCakes = await storeCakeService.filterStoreCakes(store_id, filters);
            res.json(storeCakes);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // 매장별 케이크 재고 등록
    static async create(req, res) {
        try {
            const { store_id } = req;
            const newCake = await storeCakeService.createCake(store_id, req.body);
            res.status(201).json(newCake);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // 매장별 케이크 재고 업데이트
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { stock } = req.body;

            if (stock == null) {
                throw new CustomError("Stock is required", "INVALID_INPUT", 400);
            }

            const updatedCake = await storeCakeService.updateStock(req.store_id, id, stock);
            res.json(updatedCake);
        } catch (error) {
            next(error); // 에러 핸들러로 전달
        }
    }

    // 매장별 케이크 재고 삭제
    static async delete(req, res) {
        try {
            const { id } = req.params;

            // 삭제 요청
            await storeCakeService.deleteCake(req.store_id, id);
            res.status(204).end();
        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    }
}

module.exports = storeCakeController;