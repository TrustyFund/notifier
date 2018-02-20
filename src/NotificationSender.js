const fcmAdmin = require('firebase-admin');
const nodemailer = require('nodemailer');

class NotificationSender {
  constructor(fcmAuthFile, emailTransporterRequired) {
    this.upFCMServer(fcmAuthFile);
    this.createEmailTransporter(emailTransporterRequired);
  }

  upFCMServer(fcmAuthFile) {
    this.fcmServer = fcmAdmin.initializeApp({
      credential: fcmAdmin.credential.cert(fcmAuthFile),
      databaseURL: 'https://trusty-informator.firebaseio.com',
    });
  }

  createEmailTransporter(emailTransporterRequired) {
    this.emailTransporter = nodemailer.createTransport({
      auth: {
        user: emailTransporterRequired.user,
        pass: emailTransporterRequired.pass,
      },
      service: emailTransporterRequired.service
    });
  }

  sendMessage(message, client, notificationType) {
    switch (notificationType) {
      case ('email'):
        this.sendEmail(message, client);
        break;

      case ('android'):
        this.sendPush(message, client);
        break;

      case ('ios'):
        this.sendPush(message, client);
        break;

      default:
        break;
    }
  }

  sendEmail(message, client) {
    if (message === undefined) {
      return;
    }

    const emailOptions = {
      from: 'lobovoiudar@yandex.ru',
      to: client,
      subject: message.subject,
      text: message.body,
    };
    this.emailTransporter.sendMail(emailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  sendPush(message, client) {
    this.fcmServer.messaging().sendToDevice(client, message)
      .then((response) => {
        console.log('message is sent', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
  }
}

module.exports = NotificationSender;
