/* eslint-disable */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fails' : 'error';
        this.isOperational = true;
        // console.log("message", message);
        Error.captureStackTrace(this, this.constructor);
        
    }
}

module.exports = AppError;