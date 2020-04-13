let app = require('../../server/server');
const loggerManager = require('../models/logger');
const logger = loggerManager.defaultLogger;
let axios = require('axios');
const datetime = require('../../common/constants/datetime');
const notify = require('../../common/utility/notify');
const daemonFounder = require('../external/daemon');

module.exports = function (Transaction) {
    Transaction.observe('before save', function (ctx, next) {
        if (ctx.isNewInstance) {
            ctx.instance.createdAt = datetime.getNow();
            ctx.instance.updatedAt = datetime.getNow();
        } else {
            ctx.data.updatedAt = datetime.getNow();
        }
        next();
    });

    Transaction.getTransactionByTxId = async function (txId) {
        return Transaction.findOne({
            where: {
                txId: txId,
            },
        })
    };

    Transaction.getHistory = async function (userId, coinSymbol, type, page, limit) {
        let result = {
            transactions: [],
        };
        if (!limit) limit = 20;
        if (page) page = 1;
        let where = {userId: userId};
        if (type) where.type = type;
        let fullTxs = await Transaction.find({
            where: where,
            order: 'updated_at desc',
            limit: limit,
            skip: (page - 1) * limit,
        });
        let transactions = [];
        for (let i = 0; i < fullTxs.length; i++) {
            if (fullTxs[i].data.originalAmount > 0) {
                fullTxs[i].data.amount = fullTxs[i].data.originalAmount;
                if (fullTxs[i].data.status > 1) {
                    fullTxs[i].data.status = 0;
                }
            }
            transactions.push(fullTxs[i].data);
        }
        let nextPage = page + 1;
        let totalPage = page + 1;

        if (transactions.length < limit) {
            nextPage = page
        }
        result = {
            nextPage: nextPage,
            totalPage: totalPage,
            totalTransaction: transactions.length,
            transactions: transactions,
        };
        return [200, result];
    };

    Transaction.addTransaction = async function (userId, txId, type, data) {
        let transaction = {
            txId: txId,
            state: 0,
            userId: userId,
            type: type,
            data: data,
        };
        return Transaction.upsert(transaction);
    };

    Transaction.remoteMethod(
        'getHistory',
        {
            http: {path: '/get-history', verb: 'get'},
            accepts: [
                {arg: 'user_id', type: 'string', required: 'true'},
                {arg: 'coin_symbol', type: 'string'},
                {arg: 'type', type: 'string', description: 'deposit, withdraw, exchange'},
                {arg: 'page', type: 'number', default: 1},
                {arg: 'limit', type: 'string', default: 25},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'data', type: 'object'}],
        },
    );
};
