'use strict';
const McashAuth = require('../../server/mcash-auth');
const uuid = require('uuid/v4');
const app = require('../../server/server');
const Boom = require('@hapi/boom');
module.exports = function (Auth) {
  Auth.login = async function (coinSymbol, address, message, signature) {
    const data = await McashAuth.login(message, signature, address, coinSymbol)
    if (data.success) {
      let code = null;
      let availableBalance = null;
      coinSymbol = coinSymbol.toUpperCase();
      const { Account, Blockchain, Balance } = app.models;
      const coin = await Blockchain.findOne({ where: { coinSymbol } });
      if (!coin) throw Boom.badRequest('Coin does not exist!');
      const user = await Account.findOne({ where: { address } });
      if (!user) {
        let userId = uuid();
        userId = userId.split('-').join('');
        const record = await Account.create({
          blockchainId: coin.blockchainId,
          userId,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
          address,
        })
        const accountBalance = await Balance.create({
          userId: record.id,
          totalBalance: 0,
          availableBalance: 0,
          lockedBalance: 0,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000)
        })
        code = userId;
        availableBalance = accountBalance.availableBalance;

      }
      else {
        code = user.userId;
        const accountBalance = await Balance.findOne({ where: { userId: user.id } });
        if (!accountBalance) throw Boom.badData('Account does not exists!');
        availableBalance = accountBalance.availableBalance;
      }
      let token = await app.utils.jwt.generateToken({ code });
      await Account.upsertWithWhere({ userId: code }, { accessToken: token,updatedAt: Math.floor(Date.now() / 1000)});
      return [200, { code, availableBalance, token }]
    }
    throw Boom.badRequest(data.error.message);
  };
  Auth.message = async function (address, cb) {
    const data = await McashAuth.createMessage(address);
    if (!data) throw Boom.badImplementation('Something wrong!')
    return [200, data];
  };
  Auth.verifyToken = async function (token) {
    const { Account, Balance } = app.models;
    const data = app.utils.jwt.verifyToken(token);
    const user = await Account.findOne({ where: { accessToken: token } });
    if (!data || !user) throw Boom.badRequest('Invalid token!')
    const balance = await Balance.findOne({ where: { userId: user.id } });
    if (!balance) throw Boom.badRequest('Account does not exist!')
    return [200, { uuid: data.data.uuid, availableBalance: balance.availableBalance }];
  };
  Auth.remoteMethod(
    'login',
    {
      http: { path: '/login', verb: 'post' },
      accepts: [
        { arg: 'coin_symbol', type: 'string', required: 'true' },
        { arg: 'address', type: 'string', required: 'true' },
        { arg: 'message', type: 'string', required: 'true' },
        { arg: 'signature', type: 'string', required: 'true' }
      ],
      returns: [
        { arg: 'status', type: 'number' },
        { arg: 'data', type: 'object' }
      ]
    },
  );
  Auth.remoteMethod(
    'message',
    {
      http: { path: '/message', verb: 'get' },
      accepts: [
        { arg: 'address', type: 'string', required: 'true' },
      ],
      returns: [
        { arg: 'status', type: 'number' },
        { arg: 'data', type: 'object' }
      ],
    },
  );
  Auth.remoteMethod(
    'verifyToken',
    {
      http: { path: '/verify-token', verb: 'get' },
      accepts: [
        { arg: 'token', type: 'string', required: 'true' },
      ],
      returns: [
        { arg: 'status', type: 'number' },
        { arg: 'data', type: 'object' }
      ],
    },
  );
};
