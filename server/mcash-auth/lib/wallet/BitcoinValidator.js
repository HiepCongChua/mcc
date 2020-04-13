let base58 = require('../crypto/base58')
let segwit = require('../crypto/segwit_addr')
let cryptoUtils = require('../crypto/utils')

let DEFAULT_NETWORK_TYPE = 'prod'

function getDecoded(address) {
    try {
        return base58.decode(address)
    } catch (e) {
        // if decoding fails, assume invalid address
        return null
    }
}

function getChecksum(hashFunction, payload) {
    // Each currency may implement different hashing algorithm
    switch (hashFunction) {
        case 'blake256':
            return cryptoUtils.blake256Checksum(payload)
        case 'sha256':
        default:
            return cryptoUtils.sha256Checksum(payload)
    }
}

function getAddressType(address, currency) {
    currency = currency || {}
    // should be 25 bytes per btc address spec and 26 decred
    let expectedLength = currency.expectedLength || 25
    let hashFunction = currency.hashFunction || 'sha256'
    let decoded = getDecoded(address)

    if (decoded) {
        let length = decoded.length

        if (length !== expectedLength) {
            return null
        }

        let checksum = cryptoUtils.toHex(decoded.slice(length - 4, length)),
            body = cryptoUtils.toHex(decoded.slice(0, length - 4)),
            goodChecksum = getChecksum(hashFunction, body)

        return checksum === goodChecksum ? cryptoUtils.toHex(decoded.slice(0, expectedLength - 24)) : null
    }

    return null
}

function isValidP2PKHandP2SHAddress(address, currency, networkType) {
    networkType = networkType || DEFAULT_NETWORK_TYPE

    let correctAddressTypes
    let addressType = getAddressType(address, currency)

    if (addressType) {
        if (networkType === 'prod' || networkType === 'testnet') {
            correctAddressTypes = currency.addressTypes[networkType]
        } else {
            correctAddressTypes = currency.addressTypes.prod.concat(currency.addressTypes.testnet)
        }

        return correctAddressTypes.indexOf(addressType) >= 0
    }

    return false
}

module.exports = {
    isValidAddress: function (address, currency, networkType) {
        return isValidP2PKHandP2SHAddress(address, currency, networkType) || segwit.isValidAddress(address, currency.segwitHrp)
    },
}
