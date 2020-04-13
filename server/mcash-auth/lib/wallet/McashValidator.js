const McashWeb = require('mcashweb')

module.exports = {
    isValidAddress: function (address, currency, networkType) {
        return McashWeb.isAddress(address)
    },
}
