const logger = require('../models/logger').defaultLogger;
const daemonFounder = require('../external/daemon');
let axios = require('axios');

module.exports = function (Blockchain) {
    let blockchains;
    let idToBlockchains;
    let idToHandlers;
    let contractAddressToBlockchains;
    let propertyIdToBlockchains;

    Blockchain.loadBlockchain = async function (fullReload) {
        blockchains = await Blockchain.find({where: {status: 1}});
        idToBlockchains = {};
        idToHandlers = {};
        contractAddressToBlockchains = {};
        propertyIdToBlockchains = {};
        for (let i = 0, len = blockchains.length; i < len; i++) {
            let blockchain = blockchains[i];
            // default that wallet is not open
            if (blockchain.config.contractAddress) {
                contractAddressToBlockchains[blockchain.config.contractAddress] = blockchain;
            }
            if (blockchain.config.propertyId) {
                propertyIdToBlockchains[blockchain.config.propertyId] = blockchain;
            }
            idToBlockchains[blockchain.coinSymbol] = blockchain;
        }
        return blockchains;
    };

    Blockchain.upsertBlockchain = async function (blockchain) {
        blockchain.wallet.privateKey = null;
        blockchain.wallet.isUnlocked = 0;
        delete blockchain.wallet.privateKey;
        delete blockchain.wallet.isUnlocked;
        return Blockchain.upsert(blockchain);
    };

    Blockchain.getAllCoinSymbol = function () {
        return blockchains;
    };

    Blockchain.getAddressBlockchainId = function (coinSymbol) {
        let blockchain = Blockchain.getBlockchainByCoinSymbol(coinSymbol);
        return (blockchain.addressBlockchainId ? blockchain.addressBlockchainId : blockchain.blockchainId);
    };

    Blockchain.getOwnBlockchains = async function () {
        return Blockchain.find({where: {status: 1, isBlockchain: 1}});
    };

    Blockchain.getIdToBlockchains = function () {
        return idToBlockchains;
    };
    Blockchain.getFeeByCoinSymbol = function (coinSymbol) {
        return idToBlockchains[coinSymbol]['fee'];
    };

    Blockchain.getBlockchainByCoinSymbol = function (coinSymbol) {
        return idToBlockchains[coinSymbol];
    };

    Blockchain.getBlockchainByContractAddress = function (contractAddress) {
        return contractAddressToBlockchains[contractAddress];
    };

    Blockchain.getBlockchainByPropertyId = function (propertyId) {
        return propertyIdToBlockchains[propertyId];
    };

    Blockchain.isValidFromAddress = function (coinSymbol, fromAddress) {
        return !(Blockchain.getHotWalletAddress(coinSymbol) === fromAddress);
    };

    Blockchain.isUnlockHotWallet = function (coinSymbol) {
        let blockchain = idToBlockchains[coinSymbol];
        return (1 === blockchain.wallet.isUnlocked);
    };

    Blockchain.getAllBlockchains = async function (status) {
        let where = {};
        if (status >= 0) {
            where.status = status
        }
        let results = {
            total: blockchains.length,
            blockchains: blockchains,
        };
        return [200, 'Get Info Successfully', results];
    };

    Blockchain.callToFounderDaemon = async function (data, methodName) {
        try {
            let result = await daemonFounder.forwardBridgePoint(methodName, data);
            if (result && result.data && result.data.status === 200) {
                return [result.data.status, result.data.message, result.data.data];
            }
        } catch (e) {
            console.log(e);
            return [201, 'failed'];
        }
    };

    Blockchain.bridgeEndpoint = async function (data, methodName) {
        let Withdraw = Blockchain.app.models.Withdraw;
        let WalletDeposit = Blockchain.app.models.WalletDeposit;
        console.log(methodName, data);
        switch (methodName) {
            case 'get-all-blockchains':
                return Blockchain.getAllBlockchains(data.status);
            case 'add-new-coin':
                return Blockchain.addNewCoin(data.name, data.coinSymbol, data.blockchainId, data.config, data.rpcConfig,
                    data.wallet, data.type, data.isWithdrawable);
            case 'update-coin':
                return Blockchain.updateCoin(data.name, data.coinSymbol, data.blockchainId, data.config, data.rpcConfig,
                    data.wallet, data.type, data.isWithdrawable);
            case 'activate-coin':
                return Blockchain.activateCoin(data.coinSymbol);
            case 'disable-coin':
                return Blockchain.disableCoin(data.coinSymbol);
            case 'unlock-wallet':
                return Blockchain.unlockWallet(data.coinSymbol, data.privateKey);
            case 'lock-wallet':
                return Blockchain.lockWallet(data.coinSymbol);
            case 'manual-add-deposit':
                return WalletDeposit.manualAddDeposit(data.userId, data.coinSymbol, data.transaction);
            case 'enable-withdraw':
            case 'enable-collect-deposit':
            case 'disable-withdraw':
            case 'get-withdraws':
            case 'get-notifications':
            case 'get-manual-withdraw':
            case 'manual-update-withdraw':
                return Blockchain.callToFounderDaemon(data, methodName);
            default:
                return [200, 'success', {}];
        }
    };

    Blockchain.remoteMethod(
        'bridgeEndpoint',
        {
            http: {path: '/bridge-endpoint', verb: 'post'},
            accepts: [
                {arg: 'data', type: 'object'},
                {arg: 'method_name', type: 'string'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {arg: 'data', type: 'object'}],
        },
    );

    Blockchain.remoteMethod(
        'getAllBlockchains',
        {
            http: {path: '/get-all-blockchains', verb: 'get'},
            accepts: [
                {arg: 'status', type: 'number'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {arg: 'data', type: 'object'}],
        },
    );

    Blockchain.enableWithdraw = async function (coinSymbol) {
        let blockchain = Blockchain.getBlockchainByCoinSymbol(coinSymbol);
        blockchain.isWithdrawable = 1;
        await Blockchain.upsertBlockchain(blockchain);
        return [200, 'Enable Successfully', blockchain];
    };

    Blockchain.remoteMethod(
        'enableWithdraw',
        {
            http: {path: '/enable-withdraw', verb: 'post'},
            accepts: [
                {arg: 'coin_symbol', type: 'string', required: 'true'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {arg: 'data', type: 'object'}],
        },
    );

    Blockchain.disableWithdraw = async function (coinSymbol) {
        let blockchain = await Blockchain.findOne({
            where: {
                coinSymbol: coinSymbol,
            },
        });
        blockchain.isWithdrawable = 0;
        await Blockchain.upsertBlockchain(blockchain);
        return [200, 'Disable Successfully', blockchain];
    };

    Blockchain.remoteMethod(
        'disableWithdraw',
        {
            http: {path: '/disable-withdraw', verb: 'post'},
            accepts: [
                {arg: 'coin_symbol', type: 'string', required: 'true'},
            ],
            returns: [{arg: 'status', type: 'number'}, {arg: 'message', type: 'string'}, {arg: 'data', type: 'object'}],
        },
    );

    Blockchain.getBlockchainIdByCoinSymbol = function (coinSymbol) {
        if (coinSymbol in idToBlockchains) {
            return idToBlockchains[coinSymbol].blockchainId;
        } else {
            throw new Error(`Coin Symbol = ${coinSymbol} not supported!`);
        }
    };

    Blockchain.getBlockchainHandlerByCoinSymbol = function (coinSymbol) {
        if (coinSymbol in idToHandlers) {
            return idToHandlers[coinSymbol];
        } else {
            throw new Error(`BlockchainId = ${coinSymbol} not supported!`);
        }
    };

    Blockchain.getHotWalletAddress = function (coinSymbol) {
        return idToBlockchains[coinSymbol].wallet.hotWalletAddress;
    };

    Blockchain.getColdWalletAddress = function (coinSymbol) {
        return idToBlockchains[coinSymbol].wallet.coldWalletAddress;
    };
};

