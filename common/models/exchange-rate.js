let app = require('../../server/server');
let datetime = require('../constants/datetime');
let daemonFounder = require('../external/daemon');
let axios = require('axios');
const loggerManager = require('../models/logger');
const logger = loggerManager.defaultLogger;
const Utils = require('../constants/utils');

let util = require('util');
const waitFor = util.promisify(setTimeout);

module.exports = function (ExchangeRate) {
    ExchangeRate.observe('before save', function (ctx, next) {
        if (ctx.isNewInstance) {
            ctx.instance.createdAt = datetime.getNow();
            ctx.instance.updatedAt = datetime.getNow();
        } else {
            ctx.data.updatedAt = datetime.getNow();
        }
        next();
    });

    ExchangeRate.getRate = async function (symbol) {
        return ExchangeRate.findOne({
            where: {
                source: symbol,
            },
        });
    };

    ExchangeRate.updateRate = async function (symbol) {
        try {
            let exchangeRate = await ExchangeRate.findOne({
                where: {
                    source: symbol,
                },
            });
            let price = 1;
            if (symbol !== 'USDT') {
                let url = 'https://api.binance.com/api/v3/avgPrice?symbol=' + symbol + 'USDT';
                let result = await axios.get(url);
                if (result && result.data) {
                    price = result.data['price'];
                }
            }
            exchangeRate.price = parseFloat(Utils.formatNumber(price, 2));
            exchangeRate.buyRate = parseFloat(Utils.formatNumber(exchangeRate.price * 1000 * (1 - exchangeRate.buyFee), 9));
            exchangeRate.sellRate = parseFloat(Utils.formatNumber(1 / (exchangeRate.price * 1000) * (1 - exchangeRate.sellFee), 9));
            logger.info('ExchangeRate.updateRate %s buyRate %s sellRate %s', symbol, exchangeRate.buyRate, exchangeRate.sellRate);
            return ExchangeRate.upsert(exchangeRate);
        } catch (e) {
            console.log(e.message);
        }
        return null;
    };

    ExchangeRate.updateBinanceRate = async function () {
        let result = [];
        try {
            let s1 = await ExchangeRate.updateRate('BTC');
            let s2 = await ExchangeRate.updateRate('ETH');
            let s3 = await ExchangeRate.updateRate('USDT');
            result.push(s1);
            result.push(s2);
            result.push(s3);
        } catch (e) {
            console.log(e.message);
        }
        return [200, 'success', result];
    };

    ExchangeRate.remoteMethod(
        'updateBinanceRate',
        {
            http: {path: '/update-binance-rate', verb: 'post'},
            accepts: [],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {
                arg: 'data', type: 'object',
            }],
        },
    );
}
;
