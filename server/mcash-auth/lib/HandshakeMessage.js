const Strings = require('./Strings');

class HandshakeMessage {

    constructor() {
        this.messages = new Map();
    }

    isSimpleMode() {
        return false;
    }

    createMessage(address, defaultMessage) {
        if (!address) return null;

        let message = defaultMessage;
        if (!this.isSimpleMode()) {
            message = Strings.randomUniqueId();
            // message = 'message'
            /**
             * To generate message signature, login to mcashlight first then run below
             * code under console:  mcasWeb.mcash.sign(mcasWeb.toHex('message'))
             */
            // TODO save message into cached storage
            this.messages.set(address, message);
        }

        return message;
    }

    getMessage(address, defaultMessage) {
        let message = address ? defaultMessage : null;

        if (address) {
            if (!this.isSimpleMode()) {
                // TODO get message from cached storage
                message = this.messages.get(address);
            }
        }

        return message;
    }

    verifyMessage(address, message, defaultMessage) {
        let savedMessage = null;
        if (this.isSimpleMode()) {
            savedMessage = defaultMessage;
        } else {
            if (address && message) {
                savedMessage = this.getMessage(address);
            }
        }

        return savedMessage ? savedMessage === message : false;
    }
}

module.exports = HandshakeMessage;
