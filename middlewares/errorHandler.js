const CustomError = require("./CustomError");

const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err instanceof CustomError) {
        return res.status(err.statusCode || 400).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
    }

    return res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "서버에서 문제가 발생했습니다.",
        },
    });
};

module.exports = errorHandler;