const { DataTypes } = require("sequelize");
const { sequelize } = require("./db");

// 모델 정의
const schemas = {
    // 매장 테이블
    Store: sequelize.define(
        "Store",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "USER",
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            timestamps: true,
            underscored: true,
        }
    ),

    // 케이크 정보 테이블
    Cake: sequelize.define(
        "Cake",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
            },
            image_url: {
                type: DataTypes.STRING,
            },
        },
        {
            timestamps: true,
            underscored: true,
        }
    ),

    // 매장별 케이크 재고 테이블
    StoreCake: sequelize.define(
        "StoreCake",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            store_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            cake_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            stock: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
        },
        {
            timestamps: true,
            underscored: true,
        }
    ),

    // 예약 테이블
    Reservation: sequelize.define(
        "Reservation",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            customer_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            customer_phone: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            store_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            pickup_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            order_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            pickup_time: {
                type: DataTypes.TIME,
                allowNull: false,
            },
            pickup_status: {
                type: DataTypes.ENUM("pending", "picked_up", "cancelled"),
                allowNull: false,
                defaultValue: "pending",
            },
            supplies: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
            },
            request: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            timestamps: true,
            underscored: true,
        }
    ),

    // 예약-케이크 연결 테이블
    ReservationCake: sequelize.define(
        "ReservationCake",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            reservation_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            cake_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            timestamps: true,
            underscored: true,
        }
    ),
};

// 관계 설정

// 매장 - 매장별 케이크 관계
schemas.StoreCake.belongsTo(schemas.Store, { foreignKey: "store_id", as: "store" });
schemas.Store.hasMany(schemas.StoreCake, { foreignKey: "store_id", as: "storeCakes" });

// 매장별 케이크 - 케이크 정보 관계
schemas.StoreCake.belongsTo(schemas.Cake, { foreignKey: "cake_id", as: "cakeInfo" });
schemas.Cake.hasMany(schemas.StoreCake, { foreignKey: "cake_id", as: "storeCakes" });

// 매장 - 예약 관계
schemas.Reservation.belongsTo(schemas.Store, { foreignKey: "store_id", as: "store" });
schemas.Store.hasMany(schemas.Reservation, { foreignKey: "store_id", as: "reservations" });

// 예약 - 케이크 정보 (다대다)
schemas.Reservation.belongsToMany(schemas.Cake, {
    through: schemas.ReservationCake,
    foreignKey: "reservation_id",
    otherKey: "cake_id",
    as: "cakes",
});
schemas.Cake.belongsToMany(schemas.Reservation, {
    through: schemas.ReservationCake,
    foreignKey: "cake_id",
    otherKey: "reservation_id",
    as: "reservations",
});

module.exports = schemas;
