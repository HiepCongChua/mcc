/**
 * Created by codevui on 6/3/17.
 */

module.exports = function (app) {
    let path = require('path');
    let models = require(path.resolve(__dirname, '../model-config.json'));
    let datasources = require(path.resolve(__dirname, '../datasources.json'));

    function autoUpdateAll() {
        Object.keys(models).forEach(function (key) {
            if (typeof models[key].dataSource !== 'undefined') {
                let ignoreTables = [];
                if (ignoreTables.indexOf(key) < 0 && typeof datasources[models[key].dataSource] !== 'undefined') {
                    app.dataSources[models[key].dataSource].autoupdate(key, function (err) {
                        if (err) throw new Error(`Cannot auto update ${key}: ${err.message}`);
                        console.log('Model ' + key + ' updated');
                    });
                }
            }
        });
    }

    function autoMigrateAll() {
        Object.keys(models).forEach(function (key) {
            if (typeof models[key].dataSource !== 'undefined') {
                if (typeof datasources[models[key].dataSource] !== 'undefined') {
                    app.dataSources[models[key].dataSource].automigrate(key, function (err) {
                        if (err) throw err;
                        console.log('Model ' + key + ' migrated');
                    });
                }
            }
        });
    }

    // TODO: change to autoUpdateAll when ready for CI deployment to production
    //   autoMigrateAll();
    autoUpdateAll();
};
