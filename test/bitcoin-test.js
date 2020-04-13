let superagent = require('superagent');
let assert = require('assert')
let app = require('../server/server');
let Block = app.models.Block;
let status = require('http-status');


describe('/get-blocks', function () {

    let server
    before(function () {
        server = app.start();
    });

    after(function () {
        server.close();
    });

    it('Query correct blocks', function (done) {
        let block_size = 2;
        let url = 'http://localhost:3018/api/Blocks/get-blocks?coin_symbol=XZCT&from_block=2&number_blocks=2'
        superagent.get(url).end(function (err, res) {
            assert.ifError(err);
            let body = res.body
            assert.equal(body.status, status.OK);
            assert.equal(body.data.length, block_size);
            done();
        });
    });
});
