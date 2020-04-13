let app = require('../../server/server');
let log = require('tracer').console();

/*
  To send email,Please using code below:
  let emailSend = {};
    emailSend.to = 'dungtrihp12476@gmail.com';
    emailSend.from = 'Vinex System <system@vinex.network>';
    emailSend.subject = 'Vinex Verify Account';
    emailSend.html = 'Hello'
    require('../mail/mail-enpoint').sendMail(emailSend);
   */
function sendRawEmail(emailSend) {
    // let mailUsedModel = app.models.GmailModel;
    // let mailUsedModel = app.models.MailGunModel;
    let mailUsedModel = app.models.SesMailModel;

    mailUsedModel.send(emailSend, function (err, mail) {
        log.info('email sent!', mail);
        if (err) log.error(err);
    });
}

function sendEmail(to, subject, content, from) {
    let sendFrom = from || 'Vinex System <system@vinex.network>'; // should be in config
    let emailData = {
        to: to,
        from: sendFrom,
        subject: subject,
        html: content,
    };
    sendRawEmail(emailData)
}

module.exports = {
    sendRawEmail: sendRawEmail,
    sendEmail: sendEmail,
};
