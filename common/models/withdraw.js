let app = require('../../server/server');
let datetime = require('../constants/datetime');
let constants = require('../constants/constants');
let Utils = require('../constants/utils');
let helper = require('../utility/helper');
let axios = require('axios');
const loggerManager = require('../models/logger');
const logger = loggerManager.defaultLogger;

let util = require('util');
const waitFor = util.promisify(setTimeout);

module.exports = function (Withdraw) {
    Withdraw.observe('before save', function (ctx, next) {
        if (ctx.isNewInstance) {
            ctx.instance.createdAt = datetime.getNow();
            ctx.instance.updatedAt = datetime.getNow();
        } else {
            ctx.data.updatedAt = datetime.getNow();
        }
        next();
    });

    Withdraw.getWithdrawById = async function (withdrawId) {
        return Withdraw.findOne({
            where: {
                withdrawId: withdrawId,
            },
        })
    };

    Withdraw.addWithdraw = async function (withdrawId, userId, coinSymbol, toAddress, amount, cb) {
        logger.info('Withdraw.addWithdraw withdrawId=%s, coinSymbol=%s', withdrawId, coinSymbol);
        const Transaction = Withdraw.app.models.Transaction;
        let withdraw = await Withdraw.getWithdrawById(withdrawId);
        if (withdraw) {
            logger.info('-- WithdrawId=%s is exists', withdrawId);
            return [412, 'Withdraw id is duplicated!'];
        }
        withdraw = {
            withdrawId: withdrawId,
            coinSymbol: coinSymbol,
            address: toAddress.trim(),
            originalAmount: amount,
            isAnnounced: 0,
            userId: userId,
            status: 0,
            createdAt: datetime.getNow(),
        };
        try {
            let transaction = await Transaction.addTransaction(userId, Utils.generateId(), 'withdraw', withdraw);
            withdraw.generalId = transaction.txId;
            withdraw = await Withdraw.upsert(withdraw);
            return [200, 'Received Withdraw', withdraw];
        } catch (e) {
            logger.info(e);
            return [411, 'Something went wrong'];
        }
    };

    Withdraw.getWithdrawFee = async function (coinSymbol) {
        logger.info('Withdraw.getWithdrawFee %s', coinSymbol);
        const WithdrawFee = Withdraw.app.models.WithdrawFee;
        try {
            let withdrawFee = await WithdrawFee.findOne({
                where: {
                    coinSymbol: coinSymbol,
                },
            });
            return [200, 'Received Withdraw Fee', withdrawFee];
        } catch (e) {
            logger.info(e);
            return [411, 'Something went wrong'];
        }
    };

    Withdraw.updateWithdraw = async function (withdrawId, status, txId) {
        logger.info('Withdraw.updateWithdraw id: %s status: %s, txId: %s', withdrawId, status, txId);
        const Transaction = Withdraw.app.models.Transaction;
        let withdraw = await Withdraw.getWithdrawById(withdrawId);
        if (!withdraw) {
            logger.info('-- Invalid withdraw Id');
        } else {
            withdraw.status = status;
            if (txId) withdraw.txId = txId;
            let transaction = await Transaction.getTransactionByTxId(withdraw.generalId);
            if (!transaction) {
                logger.info('-- Invalid withdraw Id, not found transaction');
            } else {
                transaction.state = constants.STATE_PENDING;
                transaction.data.status = status;
                await Withdraw.upsert(withdraw);
                await Transaction.upsert(transaction);
                return [200, 'successfully']
            }
        }
        return [411, 'Something went wrong with transaction'];
    };

    Withdraw.remoteMethod(
        'addWithdraw',
        {
            http: {path: '/add-withdraw', verb: 'post'},
            accepts: [
                {arg: 'withdraw_id', type: 'string', required: 'true'},
                {arg: 'user_id', type: 'string', required: 'true'},
                {arg: 'coin_symbol', type: 'string', required: 'true'},
                {arg: 'to_address', type: 'string', required: 'true'},
                {arg: 'amount', type: 'number', required: 'true'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {
                arg: 'data', type: 'object',
            }],
        },
    );

    Withdraw.remoteMethod(
        'getWithdrawFee',
        {
            http: {path: '/get-withdraw-fee', verb: 'post'},
            accepts: [
                {arg: 'coin_symbol', type: 'string', required: 'true'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {
                arg: 'data', type: 'object',
            }],
        },
    );

    Withdraw.remoteMethod(
        'updateWithdraw',
        {
            http: {path: '/update-withdraw', verb: 'post'},
            accepts: [
                {arg: 'withdraw_id', type: 'number', required: 'true'},
                {arg: 'status', type: 'number', required: 'true'},
                {arg: 'tx_id', type: 'string'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {
                arg: 'data', type: 'object',
            }],
        },
    );
};
