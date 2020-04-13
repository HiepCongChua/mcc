/**
 * Created by codevui on 2/10/17.
 */
const app = require('../../server/server');
const axios = require('axios');
const loggerManager = require('../models/logger');

let self = module.exports = {
    forwardBridgePoint: function (methodName, data) {
        let urlForward = app.get('URL_DAEMON_FOUNDER') + '/api/Blockchains/bridge-endpoint';
        return axios.post(urlForward, {
            data: data,
            method_name: methodName,
        }, {
            headers: {
                'authorization': app.get('DAEMON_FOUNDER_KEY'),
            },
            validateStatus: function (status) {
                return status >= 200 && status < 500; // default
            },
        });
    },
    getNewAddress: function (blockchainId, account) {
        loggerManager.defaultLogger.info('Daemon founder %s get new address for user %s', blockchainId, account);
        let urlForward = app.get('URL_DAEMON_FOUNDER') + '/api/account/get-account-address';
        urlForward += '?coin_symbol=' + blockchainId + '&account=' + account;
        return axios.get(urlForward, {
            headers: {
                'authorization': app.get('DAEMON_FOUNDER_KEY'),
            },
            // validateStatus: function (status) {
            //     return status >= 200 && status < 500; // default
            // },
        });
    },

    getTxConfirms: async function (blockchainId, txId) {
        loggerManager.defaultLogger.info('-- getTxConfirms %s %s', blockchainId, txId);
        try {
            let urlForward = app.get('URL_DAEMON_FOUNDER') + '/api/transaction/check-confirmation-status';
            let result = await axios.post(urlForward, {
                blockchain_id: blockchainId,
                txids: [txId],
            });
            if (result && result.data && result.data.data && result.data.data[txId]) {
                return result.data.data[txId]
            }
        } catch (e) {
            console.log(e.message);
        }
        return 0;
    },
};
