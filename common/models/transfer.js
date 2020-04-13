const app = require('../../server/server');
const { TYPE_ACCOUNT, TYPE_TRANSFER } = require('../constants/constants');
const Boom = require('@hapi/boom');
const loopbackContext = require('loopback-context')
module.exports = function (Transfer) {
    Transfer.createRequest = async function (typeAccount, typeTransfer, gameId, uuid, amount) {
        typeAccount = typeAccount.toUpperCase();
        typeTransfer = typeTransfer.toUpperCase();
        const { Account, Balance, Transfer } = app.models;
        const ctx = loopbackContext.getCurrentContext();
        const userId = ctx.get("user").id;
      
        if (typeAccount !== TYPE_ACCOUNT.NORMAL && typeAccount !== TYPE_ACCOUNT.MERCHANT) throw Boom.badRequest('Invalid type account!');
        if (typeTransfer !== TYPE_TRANSFER.CREDIT && typeTransfer !== TYPE_TRANSFER.RETURN) throw Boom.badRequest('Invaid type transfer!');
        if (!parseFloat(amount) || amount < 0) throw Boom.badRequest('Invalid amount!');
        const user = await Account.findOne({ where: { userId: uuid } });
        if (!user) throw new Error('Invalid user id!');
        const balance = await Balance.findOne({ where: { userId: user.id } });
        if (typeTransfer === TYPE_TRANSFER.CREDIT && ((balance.availableBalance - amount)) < 0) throw Boom.badRequest('Your account balance is not enough')
        if (typeTransfer === TYPE_TRANSFER.CREDIT) {
            // incre amount
        }
        if (typeTransfer === TYPE_TRANSFER.RETURN) {
            //derce amount
        }
        const record = {
            typeAccount,
            typeTransfer,
            gameId,
            uuid,
            amount,
            createdAt: Math.floor(Date.now() / 1000),
            updatedAt: Math.floor(Date.now() / 1000)
        }
        await Transfer.create(record);
        return [200, record];
    }
    Transfer.remoteMethod(
        'createRequest',
        {
            http: { path: '/', verb: 'post' },
            "headers": {
                "Authorization": "{token}",
                "cache-control": "no-cache",
                "Content-Type": "application/json"
            },
            accepts: [
                { arg: 'type_account', type: 'string', required: 'true', description: 'MERCHANT || NORMAL' },
                { arg: 'type_transfer', type: 'string', required: 'true', description: 'CREDIT || RETURN' },
                { arg: 'game_id', type: 'string', required: 'false' },
                { arg: 'uuid', type: 'string', required: 'true' },
                { arg: 'amount', type: 'string', required: 'true' }
            ],
            returns: [
                { arg: 'status', type: 'number' }, { arg: 'data', type: 'object' }
            ]
        },
    )
};
