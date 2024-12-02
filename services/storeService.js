const StoreDao = require("../models/StoreDao");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class StoreService {
    static async login({ username, password }) {
        // 사용자 조회
        const user = await StoreDao.findByUsername(username);
        if (!user) {
            throw new Error("Invalid username or password");
        }

        //탈퇴계정 차단
        if (!user.is_active) {
            throw new Error("This account has been deactivated");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid username or password");
        }

        const token = jwt.sign({
            store_id: user.id,
            username: user.username,
            role: user.role
        },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return token;
    }

    // 모든 매장 조회
    static async getAllStores() {
        return await StoreDao.findAll();
    }

    // 특정 매장 조회
    static async getStoreById(store_id) {
        if (!store_id) {
            throw new Error("Store ID is required");
        }

        const store = await StoreDao.findById(store_id);
        if (!store) {
            throw new Error(`Store with id ${store_id} not found`);
        }

        return {
            name: store.name,
            username: store.username,
            role: store.role,
            createdAt: store.createdAt,
        };
    }

    static async createStore(data) {
        const { name, username, password, role } = data;

        if (!name || !username || !password) {
            throw new Error("Missing required fields for store");
        }

        // 기존 사용자 확인
        const existingStore = await StoreDao.findByUsername(username);
        if (existingStore) {
            if (!existingStore.is_active) {
                await StoreDao.update(existingStore.id, {
                    name,
                    password: await bcrypt.hash(password, 10),
                    is_active: true,
                });
                return {
                    message: "Your account has been reactivated",
                };
            }

            // 활성화 상태라면 에러 발생
            throw new Error("Username already exists");
        }

        // 새 계정 생성
        const hashedPassword = await bcrypt.hash(password, 10);
        return await StoreDao.create({
            name,
            username,
            password: hashedPassword,
            role: role || "USER", // 기본값: 일반 사용자
        });
    }

    // 매장 정보 업데이트
    static async updateStore(store_id, data) {
        const store = await StoreDao.findById(store_id);
        if (!store) {
            throw new Error(`Store with id ${store_id} not found`);
        }

        return await StoreDao.update(store_id, data);
    }

    // 매장 비활(관리자용)
    static async deleteStore(store_id) {
        const store = await StoreDao.findById(store_id);
        if (!store) {
            throw new Error(`Store with id ${store_id} not found`);
        }

        // 계정 비활성화
        await StoreDao.update(store_id, { is_active: false });
        return { message: "Account deactivated successfully" };
    }
}

module.exports = StoreService;
