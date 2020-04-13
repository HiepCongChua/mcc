const Web3 = require('web3');
const McashWeb = require('mcashweb');
const Strings = require('./Strings');
const HandshakeMessage = require('./HandshakeMessage');
const WalletAddressValidator = require('./WalletAddressValidator');

const WEB3_COINS = ['TOMO', 'ETH'];
const web3 = new Web3();
const handshakeMessage = new HandshakeMessage();
const mcashWeb = new McashWeb({fullHost: 'https://mainnet.mcash.network'});

class McashWebUtils {
    async createHandshakeMessage(address) {
        if (address) {
            return handshakeMessage.createMessage(address);
        } else {
            return null;
        }
    }

    async signMessage(msg = '', privateKey) {
        try {
            return await mcashWeb.mcash.sign(mcashWeb.toHex(msg), privateKey);
        } catch (e) {
            return '';
        }
    }

    async verifyHandshakeMessage(message = '', address) {
        return handshakeMessage.verifyMessage(address, message);
    }

    async verifyMessage(message = '', signature = '', address = '', coinSymbol) {
        let valid = false;
        let error = null;

        try {
            coinSymbol = coinSymbol && coinSymbol.toUpperCase();
            if (coinSymbol === 'MCASH') {
                let validMcashAddress = WalletAddressValidator.validate(address, 'MCASH');
                if (validMcashAddress) {
                    valid = await this.verifyMcashMessage(message, signature, address);
                } else {
                    error = {
                        code: 400,
                        message: `Invalid ${coinSymbol} wallet address format!`,
                    };
                }
            } else if (this.isWeb3Coin(coinSymbol)) {
                valid = await this.verifyWeb3Message(message, signature, address);
            } else {
                error = {
                    code: 501,
                    message: `Unsupported login via ${coinSymbol} wallet!`,
                };
            }
        } catch (e) {
            valid = false;
            error = {code: 500, message: `Unable to verify your signed message!`};
        }

        return {
            valid,
            error,
        };
    }

    isWeb3Coin(coinSymbol) {
        return WEB3_COINS.includes(coinSymbol);
    }

    toSha3(message) {
        return mcashWeb.sha3(message);
    }

    async verifyMcashMessage(message = '', signature = '', address = '') {
        let valid = false;

        try {
            if (!Strings.isEmpty(message) && !Strings.isEmpty(address) && !Strings.isEmpty(signature)) {
                valid = await mcashWeb.mcash.verifyMessage(mcashWeb.toHex(message), signature, address);
            }
        } catch (e) {
            valid = false;
        }

        return valid;
    }

    async verifyWeb3Message(message = '', signature = '', address = '') {
        let valid = false;

        try {
            if (!Strings.isEmpty(message) && !Strings.isEmpty(signature)) {
                let signedAddress = web3.eth.accounts.recover(message, signature);
                valid = signedAddress === address;
            }
        } catch (e) {
            valid = false;
        }

        return valid;
    }

    convertToMcashAddress(addressHex) {
        try {
            return addressHex ? mcashWeb.address.fromHex(addressHex) : null;
        } catch (e) {
            return null;
        }
    }
}

module.exports = new McashWebUtils();
