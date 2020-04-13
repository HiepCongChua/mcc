let app = require('../../server/server');

module.exports = function (MailEndPoint) {
    MailEndPoint.sendMail = function (subject, html, text) {
        let mailUsedModel = app.models.SesMailModel;
        let email = {
            to: app.get('ADMIN_EMAIL'),
            from: app.get('EMAIL_FROM'),
            subject: subject,
        };
        if (html) {
            email.html = html;
        }
        if (text) {
            email.text = text;
        }
        mailUsedModel.send(email, function (err, mail) {
            console.log('email sent!');
            if (err) console.log(err);
        });
    };
};
