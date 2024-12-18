class CustomError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
}

module.exports = CustomError;