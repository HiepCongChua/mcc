const winston = require('winston');
const util = require('util');
const path = require('path');
const {combine, timestamp, label, printf} = winston.format;

// Define your custom format with printf.
const myFormat = printf(info => {
    const SPLAT = Symbol.for('splat');
    return `[${info.timestamp}][${info.level}]: ${util.format(info.message, ...(info[SPLAT] || []))}`
});

function createLogger(logFile, errLogFile) {
    return winston.createLogger({
        level: 'info',
        format: combine(
            label(),
            timestamp(),
            myFormat,
        ),
        transports: [
            new winston.transports.File({
                filename: path.join(__dirname + '/../../logs', logFile),
            }),
            new winston.transports.File({
                filename: path.join(__dirname + '/../../logs', errLogFile),
                level: 'error',
            }),
        ],
    });
}

module.exports.loggers = {};
module.exports.initLoggers = async function (blockchains) {
    this.loggers = {};
    for (let i = 0, len = blockchains.length; i < len; i++) {
        const blockchain = blockchains[i];
        let filename = blockchain.blockchainId.toLowerCase();
        this.loggers[blockchain.blockchainId] = createLogger(filename + '.log', 'error.log');
    }
};

module.exports.getLoggerByCoinSymbol = function (coinSymbol) {
    return this.loggers[coinSymbol] || module.exports.defaultLogger;
};

module.exports.defaultLogger = createLogger('daemon.log', 'error.log');

module.exports.withdrawLogger = createLogger('withdraw.log', 'error.log');
