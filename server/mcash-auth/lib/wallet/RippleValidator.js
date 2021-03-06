let cryptoUtils = require('../crypto/utils')
let baseX = require('base-x')

let ALLOWED_CHARS = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz'

let codec = baseX(ALLOWED_CHARS)
let regexp = new RegExp('^r[' + ALLOWED_CHARS + ']{27,35}$')

module.exports = {
    /**
     * ripple address validation
     */
    isValidAddress: function (address) {
        if (regexp.test(address)) {
            return this.verifyChecksum(address)
        }

        return false
    },

    verifyChecksum: function (address) {
        let bytes = codec.decode(address)
        let computedChecksum = cryptoUtils.sha256Checksum(cryptoUtils.toHex(bytes.slice(0, -4)))
        let checksum = cryptoUtils.toHex(bytes.slice(-4))

        return computedChecksum === checksum
    },
}
