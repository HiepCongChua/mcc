let self = module.exports = {
    error: function (statusCode, message) {
        let e = new Error(message);
        e.statusCode = statusCode;
        return {statusCode, message};
    },
};
