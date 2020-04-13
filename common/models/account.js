let app = require('../../server/server');
const datetime = require('../../common/constants/datetime');
const daemonFounder = require('../external/daemon');
const logger = require('../models/logger').defaultLogger;
let helper = require('../utility/helper');
module.exports = function (Account) {
    Account.observe('before save', function (ctx, next) {
        if (ctx.isNewInstance) {
            ctx.instance.createdAt = datetime.getNow();
            ctx.instance.updatedAt = datetime.getNow();
        } else {
            ctx.data.updatedAt = datetime.getNow();
        }
        next();
    });

    Account.getNewAddress = async function (account, blockchainId, cb) {
        logger.info(' --> Account.getNewAddress');
        try {
            let result = await daemonFounder.getNewAddress(blockchainId, account);
            if (result && result.data && result.data.data) {
                logger.info(' --> %s', result.data.data.address);
                return result.data.data.address;
            } else {
                return cb(helper.error(412, 'Not found address for this blockchain'))
            }
        } catch (e) {
            logger.info(e);
            return cb(helper.error(411, 'Something went wrong!'))
        }
    };
    Account.getAndSaveAccount = async function (coinSymbol, userId) {
        let Blockchain = app.models.Blockchain;
        coinSymbol = coinSymbol.toUpperCase();
        let addressBlockchainId = Blockchain.getAddressBlockchainId(coinSymbol);
        let acc = await Account.findOne({
            where: {blockchainId: addressBlockchainId, userId: userId},
        });
        if (acc) {
            acc['type'] = 'existing';
            return acc;
        }
        let address = await Account.getNewAddress(userId, addressBlockchainId);
        if (!address) {
            throw new Error('Could not get address');
        }
        acc = {
            blockchainId: addressBlockchainId,
            userId: userId,
            address: address,
            type: 'new',
        };
        let instance = await Account.upsert(acc);
        logger.info('SAVED ACCOUNT:\tcoinSymbol=' + instance.blockchainId +
            '\taccount=' + instance.userId + '\taddress=' + instance.address);
        return instance;
    };

    Account.getDepositAddress = async function (coinSymbol, account, cb) {
        const Blockchain = Account.app.models.Blockchain;
        logger.info('Account.getAccountAddress %s %s', account, coinSymbol);
        try {
            let acc = await Account.getAndSaveAccount(coinSymbol, account);
            let fee = Blockchain.getFeeByCoinSymbol(coinSymbol);
            if (fee) {
                acc.fee = fee
            }
            let response = JSON.parse(JSON.stringify(acc));
            cb(null, 200, response);
        } catch (e) {

        }
    };

    Account.getAccount = function (coinSymbol, address) {
        let Blockchain = app.models.Blockchain;
        let addressBlockchainId = Blockchain.getAddressBlockchainId(coinSymbol);
        return Account.findOne({
            where: {blockchainId: addressBlockchainId, address: address},
        });
    };

    Account.getBalance = async function (userId, coinSymbol) {
        logger.info(' --> Account.getBalance %s %s', userId, coinSymbol);
        const Balance = Account.app.models.Balance;
        const ExchangeRate = Account.app.models.ExchangeRate;
        let result = [];
        if (coinSymbol) {
            let userBalance = await Balance.getOrCreateUserBalance(userId, coinSymbol);
            let rate = await ExchangeRate.getRate(coinSymbol);
            userBalance.estimateUsd = rate.price * userBalance.totalBalance;
            result.push(userBalance);
        } else {
            let userBalanceETH = await Balance.getOrCreateUserBalance(userId, 'ETH');
            let rate = await ExchangeRate.getRate('ETH');
            userBalanceETH.estimateUsd = rate.price * userBalanceETH.totalBalance;
            result.push(userBalanceETH);
            let userBalanceBTC = await Balance.getOrCreateUserBalance(userId, 'BTC');
            rate = await ExchangeRate.getRate('BTC');
            userBalanceBTC.estimateUsd = rate.price * userBalanceBTC.totalBalance;
            result.push(userBalanceBTC);
            let userBalanceUSDT = await Balance.getOrCreateUserBalance(userId, 'USDT');
            rate = await ExchangeRate.getRate('USDT');
            userBalanceUSDT.estimateUsd = rate.price * userBalanceUSDT.totalBalance;
            result.push(userBalanceUSDT);
        }
        return [200, result];
    };

    Account.testNewAccountAddress = async function (account, blockchainId) {
        let address = await Account.getNewAddress(account, blockchainId);
        return [200, 'success', {address: address}];
    };

    Account.remoteMethod(
        'testNewAccountAddress',
        {
            http: {path: '/test-new-account-address', verb: 'get'},
            accepts: [
                {arg: 'account', type: 'string', required: 'true'},
                {arg: 'coin_symbol', type: 'string', required: 'true'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {arg: 'data', type: 'object'}],
        },
    );

    Account.remoteMethod(
        'getDepositAddress',
        {
            http: {path: '/get-deposit-address', verb: 'get'},
            accepts: [
                {arg: 'coin_symbol', type: 'string', required: 'true', description: 'Supported: BTC, ETH, USDT'},
                {arg: 'user_id', type: 'string', required: 'true', description: 'User uuid'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'data', type: 'object'}],
        },
    );

    Account.remoteMethod(
        'getBalance',
        {
            http: {path: '/get-balance', verb: 'get'},
            accepts: [
                {arg: 'user_id', type: 'string', required: 'true', description: 'user uuid'},
                {
                    arg: 'coin_symbol', type: 'string',
                    description: 'Supported: BTC, ETH, USDT, if not defined api will return balance of all available coins',
                },
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'data', type: 'object'}],
        },
    );
}
;
