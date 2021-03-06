const jsSHA = require('jssha/src/sha256');
const Blake256 = require('./blake256');
const keccak256 = require('./sha3')['keccak256'];
const Blake2B = require('./blake2b');

function numberToHex(number) {
    let hex = Math.round(number).toString(16);
    if (hex.length === 1) {
        hex = '0' + hex;
    }
    return hex;
}

function hexToUint8(hexString) {
    let arr = [];
    for (let i = 0; i < hexString.length; i += 2) {
        arr.push(parseInt(hexString.substr(i, 2), 16));
    }

    return new Uint8Array(arr);
}

module.exports = {
    toHex: function (arrayOfBytes) {
        let hex = '';
        for (let i = 0; i < arrayOfBytes.length; i++) {
            hex += numberToHex(arrayOfBytes[i]);
        }
        return hex;
    },
    sha256: function (hexString) {
        let sha = new jsSHA('SHA-256', 'HEX');
        sha.update(hexString);
        return sha.getHash('HEX');
    },
    sha256Checksum: function (payload) {
        return this.sha256(this.sha256(payload)).substr(0, 8);
    },
    blake256: function (hexString) {
        return new Blake256().update(hexString, 'hex').digest('hex');
    },
    blake256Checksum: function (payload) {
        return this.blake256(this.blake256(payload)).substr(0, 8);
    },
    blake2b: function (hexString, outlen) {
        return new Blake2B(outlen).update(hexToUint8(hexString)).digest('hex');
    },
    keccak256: function (hexString) {
        return keccak256(hexString);
    },
    keccak256Checksum: function (payload) {
        return keccak256(payload).toString().substr(0, 8);
    },
};
