const loopback = require('loopback');
const boot = require('loopback-boot');

const app = module.exports = loopback();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.start = function () {
    // start the web server
    return app.listen(function () {
        app.emit('started');
        let baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            let explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
        process.on('unhandledRejection', (error) => {
            if (error.stack && error.stack.indexOf('strong-remoting') >= 0) {
                // ignoring "Cannot read property 'length' of undefined"
            } else {
                console.error(error); // This prints error with stack included (as for normal errors)
            }
        });
    });
};

app.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /');
});


boot(app, __dirname, function (err) {
    if (err) throw err;
    app.utils = require('../common/utility');

    if (require.main === module) {
        app.start();
    }
});
