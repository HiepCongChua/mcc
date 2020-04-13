let app = require('../../server/server');
const datetime = require('../../common/constants/datetime');
const daemonFounder = require('../external/daemon');
const logger = require('../models/logger').defaultLogger;
let helper = require('../utility/helper');
module.exports = function (Balance) {
    Balance.observe('before save', function (ctx, next) {
        if (ctx.isNewInstance) {
            ctx.instance.createdAt = datetime.getNow();
            ctx.instance.updatedAt = datetime.getNow();
        } else {
            ctx.data.updatedAt = datetime.getNow();
        }
        next();
    });

    Balance.getOrCreateUserBalance = async function (userId, coinSymbol) {
        let userBalance = await Balance.findOne({
            where: {
                userId: userId,
                symbol: coinSymbol,
            },
        });
        if (!userBalance) {
            userBalance = {
                userId: userId,
                symbol: coinSymbol,
                totalBalance: 0,
                availableBalance: 0,
                lockedBalance: 0,
            };
            userBalance = await Balance.upsert(userBalance);
        }
        return userBalance;
    }
};
