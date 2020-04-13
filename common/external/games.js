/**
 * Created by codevui on 2/10/17.
 */
const axios = require('axios');
const loggerManager = require('../models/logger');

let self = module.exports = {
    addNewDeposit: function (data) {
        let urlInsightNoti = 'http://unidice.xyz:1340' + '/addNewDeposit';
        return axios.post(urlInsightNoti, {
            userId: data.userId,
            coinSymbol: data.coinSymbol,
            address: data.address,
            txId: data.txId,
            amount: data.amount,

        }).then(function (result) {
            console.log(result);
        }).catch(function (error) {
            console.log(error);
        });
    },

    updateDepositStatus: function (data) {
        let urlInsightNoti = 'http://unidice.xyz:1340' + '/updateDepositStatus';
        return axios.post(urlInsightNoti, [{
            txId: data.txId,
            userId: data.userId,
            coinSymbol: data.coinSymbol,
            address: data.address,
            depositId: data.depositId,
            status: data.status,
            confirm: data.confirm,
        }]).then(function (result) {
            console.log(result);
        }).catch(function (error) {
            console.log(error);
        });
    },

    updateWithdrawStatus: function (data) {
        let urlInsightNoti = 'http://118.70.118.135:8080' + '/updateWithdrawStatus';
        return axios.post(urlInsightNoti, {
            withdrawId: data.withdrawId,
            userId: data.userId,
            txId: data.txId,
            status: data.status,

        }).then(function (result) {
            console.log(result);
        }).catch(function (error) {
            console.log(error);
        });
    },

    updateExchangeStatus: function (data) {
        let urlInsightNoti = 'http://unidice.xyz:1340' + '/updateExchangeStatus';
        return axios.post(urlInsightNoti, {
            exchangeId: data.exchangeId,
            userId: data.userId,
            txId: data.txId,
            status: data.status,
            desp: data.desp,

        }).then(function (result) {
            console.log(result);
        }).catch(function (error) {
            console.log(error);
        });
    },
};
