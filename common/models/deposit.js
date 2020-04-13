let app = require('../../server/server');
let datetime = require('../constants/datetime');
let constants = require('../constants/constants');
let Utils = require('../constants/utils');
let notify = require('../utility/notify');
let daemon = require('../external/daemon');
let axios = require('axios');
const loggerManager = require('../models/logger');
const logger = loggerManager.defaultLogger;
let util = require('util');
const waitFor = util.promisify(setTimeout);

module.exports = function (Deposit) {
    Deposit.observe('before save', function (ctx, next) {
        if (ctx.isNewInstance) {
            ctx.instance.createdAt = datetime.getNow();
            ctx.instance.updatedAt = datetime.getNow();
        } else {
            ctx.data.updatedAt = datetime.getNow();
        }
        next();
    });

    Deposit.getRequiredConfirmByCoinSymbol = function (coinSymbol) {
        if (coinSymbol === 'ETH') {
            return 30;
        }
        return 2;
    };

    Deposit.addDeposit = async function (userId, address, txId, coinSymbol, confirm, status, amount) {
        logger.info('Deposit.addDeposit uid: %s address: %s txId: %s coinSymbol: %s status: %s amount: %s', userId, address, txId, coinSymbol, confirm, status, amount);
        const Transaction = Deposit.app.models.Transaction;
        let exist = await Deposit.findOne({
            where: {
                txId: txId,
                address: address,
            },
        });
        if (exist) {
            loggerManager.info('Duplicated txId:%s address:%s', txId, address);
            return [201, 'Duplicated txId: ' + txId];
        }
        // Notify new deposit comming
        let deposit = {
            userId: userId,
            address: address,
            txId: txId,
            coinSymbol: coinSymbol,
            amount: amount,
            confirm: confirm,
            depositId: Utils.generateId(),
            isNewDeposit: 1,
            status: status,
            createdAt: datetime.getNow(),
        };
        try {
            let transaction = await Transaction.addTransaction(userId, Utils.generateId(), 'deposit', deposit);
            deposit.generalId = transaction.txId;
            deposit = await Deposit.upsert(deposit);
            if (deposit) {
                return [200, 'Add deposit order success!', {txId: deposit.txId}];
            } else {
                return [411, 'Add deposit order failed!'];
            }
        } catch (e) {
            console.log(e);
            return [201, 'Add deposit order failed', e.message]
        }
    };

    Deposit.updateConfirmationTxs = async function (deposits) {
        const Transaction = Deposit.app.models.Transaction;
        for (let i = 0; i < deposits.length; i++) {
            try {
                logger.info('-- check %s', deposits[i].txId);
                let confirmation = await daemon.getTxConfirms(deposits[i].coinSymbol, deposits[i].txId);
                logger.info('-- %s %s confirmations', deposits[i].txId, confirmation);
                let requiredConfirmation = Deposit.getRequiredConfirmByCoinSymbol(deposits[i].coinSymbol);
                deposits[i].confirmation = confirmation;
                if (confirmation > requiredConfirmation) {
                    logger.info('-- confirm success %s/%s', confirmation, requiredConfirmation);
                    deposits[i].status = 1;
                } else {
                    logger.info('-- confirm pending %s/%s', confirmation, requiredConfirmation);
                }
                deposits[i].confirm = confirmation + '/' + requiredConfirmation;
                await Deposit.upsert(deposits[i]);
                let transaction = await Transaction.getTransactionByTxId(deposits[i].generalId);
                transaction.state = constants.STATE_PENDING;
                transaction.data.status = deposits[i].status;
                await Transaction.upsert(transaction);
            } catch (e) {
                console.log('-- ' + e.message);
            }
        }
    };

    Deposit.requestUpdateDeposit = async function (coinSymbol) {
        logger.info('Deposit.requestUpdateDeposit %s', coinSymbol);
        let deposits = await Deposit.find({
            where: {
                status: constants.DEPOSIT_PENDING,
                coinSymbol: coinSymbol,
            },
        });
        if (deposits.length > 0) {
            logger.info('-- found %s deposits pending', deposits.length);
            await Deposit.updateConfirmationTxs(deposits);
        }
        return [200, 'success'];
    };

    Deposit.remoteMethod(
        'requestUpdateDeposit',
        {
            http: {path: '/request-update-deposit', verb: 'post'},
            accepts: [
                {arg: 'coin_symbol', type: 'string', required: true},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {
                arg: 'data', type: 'object',
            }],
        },
    );

    Deposit.remoteMethod(
        'addDeposit',
        {
            http: {path: '/add-deposit', verb: 'post'},
            accepts: [
                {arg: 'user_id', type: 'string', required: 'true'},
                {arg: 'address', type: 'string', required: 'true'},
                {arg: 'tx_id', type: 'string', required: 'true'},
                {arg: 'coin_symbol', type: 'string', required: 'true'},
                {arg: 'confirm', type: 'number'},
                {arg: 'status', type: 'number'},
                {arg: 'amount', type: 'number'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {
                arg: 'data', type: 'object',
            }],
        },
    );
};
