let loggerManager = require('../../common/models/logger');

const logger = loggerManager.defaultLogger;

module.exports = async function (app) {
    logger.info('**********************************|**********************************');
    logger.info('**********************************|**********************************');
    logger.info('**********************************|**********************************');
    logger.info('1. Loading blockchain ...');
    const Blockchain = app.models.Blockchain;
    let blockchains = await Blockchain.loadBlockchain();
    logger.info('Loaded', blockchains.length, 'blockchains');

    logger.info('2. Init logger');
    await loggerManager.initLoggers(blockchains);
    logger.info('Init', Object.keys(loggerManager.loggers).length, 'loggers');
};
