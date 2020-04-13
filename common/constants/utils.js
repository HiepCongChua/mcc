let sha256 = require('js-sha256').sha256;
let fs = require('fs');
const uuidv4 = require('uuid/v4');

function shaHmac(key, value) {
    return sha256.hmac(key, value);
}

function checkInsightRequest(key, data, signature) {
    return sha256.hmac(key, data) === signature;
}

function formatNumber(amount, decimal) {
    if (!decimal) decimal = 8;
    let f = Math.pow(10, decimal);
    return (((Math.floor(parseFloat(amount) * f)) / f).toFixed(decimal)).toString();
}

function toFixed(x) {
    if (Math.abs(x) < 1.0) {
        let e = parseInt(x.toString().split('e-')[1]);
        if (e) {
            x *= Math.pow(10, e - 1);
            x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
        }
    } else {
        let e = parseInt(x.toString().split('+')[1]);
        if (e > 20) {
            e -= 20;
            x /= Math.pow(10, e);
            x += (new Array(e + 1)).join('0');
        }
    }
    return x;
}

function generateUUID() {
    return uuidv4().split('-').join('');
}

module.exports.shaHmac = shaHmac;
module.exports.checkInsightRequest = checkInsightRequest;
module.exports.formatNumber = formatNumber;
module.exports.toFixed = toFixed;
module.exports.generateId = generateUUID;
