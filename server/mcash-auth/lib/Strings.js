'use strict';

const _ = require('lodash');
const uuid = require('uuid/v4');

const alpha = 'abcdefghijklmnopqrstuvwxyz';
const caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numeric = '0123456789';
const passwordChars = [...alpha, ...caps, ...numeric];

class Strings {
    static isEmpty(str) {
        return !str || (typeof str !== 'string') || str.length === 0 || str.trim().length === 0;
    }

    static isString(str) {
        return str && _.isString(str);
    }

    static randomPassword(length = 6) {
        let password = '';
        for (let i = 0; i < length; i++) {
            password += passwordChars[Math.floor(Math.random() * passwordChars.length)];
        }
        return password;
    }

    static randomUniqueId() {
        // crypto.randomBytes(20).toString('hex')
        return uuid().replace(/-/g, '') + Date.now().toString(16);
    }

    static ellipsizeWalletAddress(address, maxSize = 14) {
        if (address && address.length > maxSize) {
            let pre = address.substring(0, 8);
            let last = address.substring(address.length - 6, address.length);
            return `${pre}...${last}`;
        }
        return address;
    }

    static abbreviateNumber(number, digits = 2) {
        if (!number || isNaN(number)) return number;
        const num = +number;
        const units = ['K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y'];
        let decimal = 0;

        for (let i = units.length - 1; i >= 0; i--) {
            decimal = Math.pow(1000, i + 1);

            if (num <= -decimal || num >= decimal) {
                return +(num / decimal).toFixed(digits) + units[i];
            }
        }

        return num;
    }

    static formatNumber(number, decimals = 0, decPoint, thousandsSep, trailingZeros = false) {
        if (typeof number === 'undefined') return;
        // Strip all characters but numerical ones.
        const numerical = (number + '').replace(/[^0-9+\-Ee.]/g, '');
        const n = !isFinite(+numerical) ? 0 : +numerical;
        const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
        const sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep;
        const dec = (typeof decPoint === 'undefined') ? '.' : decPoint;
        let s = '';
        const toFixedFix = function (n, prec) {
            const k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
        // Fix for IE parseFloat(0.55).toFixed(0) = 0;
        s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
        }
        if ((s[1] || '').length < prec) {
            s[1] = s[1] || '';
            if (trailingZeros) {
                // 1.123 with decimals = 5 => 1.12300
                s[1] += new Array(prec - s[1].length + 1).join('0');
            }
        }
        return s[1] ? s.join(dec) : s[0];
    }
}

module.exports = Strings;
