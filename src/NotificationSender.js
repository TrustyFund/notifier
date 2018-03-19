const fcmAdmin = require('firebase-admin');
const nodemailer = require('nodemailer');
const TelegramBotLayer = require('./TelegramBotLayer');


class NotificationSender {
  constructor(fcmAuthFile, emailTransporterRequired, telegramBotToken) {
    this.upFCMServer(fcmAuthFile);
    this.createEmailTransporter(emailTransporterRequired);
    this.upTelegramBot(telegramBotToken);
    this.from = emailTransporterRequired.user;
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

  upTelegramBot(telegramBotToken) {
    this.telegramBotLayer = new TelegramBotLayer(telegramBotToken);
    this.telegramBotLayer.listen();
  }

  sendMessage(message, destination, notificationType) {
    switch (notificationType) {
      case ('email'):
        this.sendEmail(message, destination);
        break;

      case ('android'):
        this.sendPush(message, destination);
        break;

      case ('ios'):
        this.sendPush(message, destination);
        break;

      default:
        break;
    }
  }

  sendEmail(message, destination) {
    if (message === undefined) {
      return;
    }

    const emailOptions = {
      from: this.from,
      to: destination,
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
