let app = require('../../server/server');
let datetime = require('../constants/datetime');
let Utils = require('../constants/utils');
let daemonFounder = require('../external/daemon');
let axios = require('axios');
const loggerManager = require('../models/logger');
const logger = loggerManager.defaultLogger;

let util = require('util');
const waitFor = util.promisify(setTimeout);

module.exports = function (Exchange) {
    Exchange.observe('before save', function (ctx, next) {
        if (ctx.isNewInstance) {
            ctx.instance.createdAt = datetime.getNow();
            ctx.instance.updatedAt = datetime.getNow();
        } else {
            ctx.data.updatedAt = datetime.getNow();
        }
        next();
    });

    Exchange.addExchange = async function (userId, exchangeId, source, target, rate, amount) {
        logger.info('Exchange.addExchange uid: %s eId: %s source: %s target: %s rate: %s amount: %s', userId, exchangeId, source, target, rate, amount);
        const Transaction = Exchange.app.models.Transaction;
        let exist = await Exchange.findOne({
            where: {
                exchangeId: exchangeId,
            },
        });
        if (exist) {
            return [201, 'Duplicated exchangeId: ' + exchangeId];
        }
        let exchange = {
            userId: userId,
            source: source,
            target: target,
            rate: rate,
            amount: amount,
            txId: Utils.generateId(),
            exchangeId: exchangeId,
            status: 0,
            createdAt: datetime.getNow(),
        };
        try {
            let transaction = await Transaction.addTransaction(userId, Utils.generateId(), 'exchange', exchange);
            exchange.generalId = transaction.txId;
            exchange = await Exchange.upsert(exchange);
            if (exchange) {
                return [200, 'Add exchange order success!', {txId: exchange.txId}];
            } else {
                return [411, 'Add exchange order failed!'];
            }
        } catch (e) {
            console.log(e);
            return [201, 'Add exchange order failed', e.message]
        }
    };

    Exchange.getExchangeRate = async function (source, target) {
        if (source === 'CHIP') {
            let exchangeRate = await Exchange.app.models.ExchangeRate.findOne({
                where: {
                    source: target,
                    target: source,
                },
            });
            if (exchangeRate) {
                return [200, 'success', {rate: parseFloat(exchangeRate.sellRate.toFixed(8))}]
            }
        } else {
            let exchangeRate = await Exchange.app.models.ExchangeRate.findOne({
                where: {
                    source: source,
                    target: target,
                },
            });
            if (exchangeRate) {
                return [200, 'success', {rate: parseFloat(exchangeRate.buyRate.toFixed(8))}]
            }
        }
        return [201, 'Not support exchange pairs']
    };

    Exchange.remoteMethod(
        'addExchange',
        {
            http: {path: '/add-exchange', verb: 'post'},
            accepts: [
                {arg: 'userId', type: 'string', required: 'true'},
                {arg: 'exchange_id', type: 'string', required: 'true'},
                {arg: 'source', type: 'string', required: 'true'},
                {arg: 'target', type: 'string', required: 'true'},
                {arg: 'rate', type: 'number'},
                {arg: 'amount', type: 'number'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {
                arg: 'data', type: 'object',
            }],
        },
    );

    Exchange.remoteMethod(
        'getExchangeRate',
        {
            http: {path: '/get-exchange-rate', verb: 'post'},
            accepts: [
                {arg: 'source', type: 'string', required: 'true'},
                {arg: 'target', type: 'string', required: 'true'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {
                arg: 'data', type: 'object',
            }],
        },
    );
};
