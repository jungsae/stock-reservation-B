const StoreService = require("../services/storeService");

class StoreController {
    static async getStores(req, res) {
        try {
            const { role, store_id } = req;

            let stores;
            if (role === "ADMIN") {
                stores = await StoreService.getAllStores();
            } else if (role === "USER") {
                stores = await StoreService.getStoreById(store_id);
            } else {
                throw new Error("Unauthorized role");
            }

            res.json(stores);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ message: "Username and password are required" });
            }

            const token = await StoreService.login({ username, password });
            res.status(200).json({ message: "Login successful", token });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }

    // static async getAll(req, res) {
    //     try {
    //         const stores = await StoreService.getAllStores();
    //         res.json(stores);
    //     } catch (error) {
    //         res.status(500).json({ message: error.message });
    //     }
    // }

    // static async getOne(req, res) {
    //     try {
    //         const { id } = req.params;
    //         const { role, store_id } = req; // JWT에서 role과 store_id 가져오기

    //         // 관리자가 아니고, 요청한 ID가 로그인한 매장의 ID와 다르면 접근 금지
    //         if (role !== "ADMIN" && parseInt(id) !== store_id) {
    //             return res.status(403).json({ message: "Access denied" });
    //         }

    //         const store = await StoreService.getStoreById(id);

    //         res.json(store);
    //     } catch (error) {
    //         res.status(404).json({ message: error.message });
    //     }
    // }

    static async create(req, res) {
        try {
            const newStore = await StoreService.createStore(req.body);
            res.status(201).json(newStore);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const newStore = await StoreService.updateStore(req.params.id, req.body);
            res.status(201).json(newStore);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            await StoreService.deleteStore(req.params.id);
            res.status(204).end();
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

    static async deactivate(req, res) {
        try {
            const { store_id } = req;
            const result = await StoreService.deleteStore(store_id);
            res.json(result);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}

module.exports = StoreController;
