let app = require('../server');
let constants = require('../../common/constants/constants');
let utils = require('../../common/constants/utils');

module.exports = function () {
    return function authorization(req, res, next) {
      

        let params = req.method === 'GET' ? req.query : req.body;
        let plainText = '';

        let keysTmp = Object.keys(params);
        // sort keys
        let keys = keysTmp.sort();
        console.log('keys', keys);
        for (let i = 0; i < keys.length - 1; i++) {
            plainText += params[keys[i]] + '_';
        }
        plainText += params[keys[keys.length - 1]];

        console.log('plainText', plainText);
        console.log('key', app.get('INSIGHT_KEY'));
        console.log('hash', utils.shaHmac(app.get('INSIGHT_KEY'), plainText));
        console.log('sig', req.headers['key']);
        if (req.headers['key'] === utils.shaHmac(app.get('INSIGHT_KEY'), plainText)) {
            next();
        } else {
            let err = new Error();
            err.status = constants.RESPONSE_CODE_UNAUTHORIZED;
            err.message = 'un authorization';
            next(err);
        }
    }
};
