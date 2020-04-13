'use strict';

const McashWebUtils = require('./lib/McashWebUtils');

module.exports = {
    login: async (message, signature, address, coinSymbol) => {
        let success = false;
        let error = null;
        if (message && signature && address && coinSymbol) {
            try {
                let validHandshakeMessage = await McashWebUtils.verifyHandshakeMessage(message, address);
                if (validHandshakeMessage) {
                    let {valid, error: verifyError} = await this.verifyMessage(message, signature, address, coinSymbol);
                    if (valid) {
                        success = true;
                    } else {
                        error = verifyError || {code: 401, message: 'Unauthorized'};
                    }
                } else {
                    error = {
                        code: 400,
                        message: 'Invalid signing message',
                    };
                }
            } catch (e) {
                success = true;
                error = {code: 500, message: 'Login unsuccessfully'};
            }
        }

        return {success, error}
    },
    createMessage: (address) => {
        if (address) {
            return McashWebUtils.createHandshakeMessage(address);
        } else {
            return null;
        }
    }
};
