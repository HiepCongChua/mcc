/**
 * Created by codevui on 2/10/17.
 */
var moment = require('moment');
var self = module.exports = {
    /*
     get start of date 00:00:00 from timestamp
     */
    getStartOfDate: function (timestamp) {
        var date = new Date(timestamp * 1000);
        date.setHours(0, 0, 0, 0);
        return (date.getTime() / 1000);
    },

    getEndOfDate: function (timestamp) {
        var date = new Date(timestamp * 1000);
        date.setHours(23, 59, 59, 999);
        return (date.getTime() / 1000);
    },

    timeStampToVNMDateString: function (timestamp) {
        var date = new Date(timestamp * 1000);
        return ((date.getYear() + 1900) + '-' + (date.getMonth() + 1) + '-' + (date.getDate()));
    },

    getNow: function () {
        return Math.floor(Date.now() / 1000);
    },

    getNowTimestamp: function () {
        return Math.floor(Date.now());
    },

    getDay: function (timestamp) {
        var date = new Date(timestamp * 1000);
        return date.getDay();
    },
    /*
     YYYY-MM-DD -> timestamp
     */
    dateStringToTimeStamp: function (day) {
        try {
            return (new Date(day)).getTime() / 1000;
        } catch (exception) {
            console.log(exception);
            return self.getNow();
        }
    },

    /*
     YYYY-MM-DD -> timestamp
     */
    getPreviousDay: function (day) {
        var date = new Date(day);
        date.setDate(date.getDate() - 1);
        return self.timeStampToVNMDateString(date.getTime() / 1000);
    },

    getNextDay: function (day) {
        var date = new Date(day);
        date.setDate(date.getDate() + 1);
        return self.timeStampToVNMDateString(date.getTime() / 1000);
    },

    /*
      convert int to date time format: YYYY-MM-DD HH:mm:ss
      if number is undefined return date now
      */
    convertNumberToDateTime: function (number) {
        let date;
        if (!number)
            date = new Date();
        else
            date = new Date(number * 1000);

        let year = '' + date.getFullYear();
        let month = '' + (date.getMonth() + 1);
        if (month.length === 1) {
            month = '0' + month;
        }
        let day = '' + date.getDate();
        if (day.length === 1) {
            day = '0' + day;
        }
        let hour = '' + date.getHours();
        if (hour.length === 1) {
            hour = '0' + hour;
        }
        let minute = '' + date.getMinutes();
        if (minute.length === 1) {
            minute = '0' + minute;
        }
        let second = '' + date.getSeconds();
        if (second.length === 1) {
            second = '0' + second;
        }
        return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    },

};
