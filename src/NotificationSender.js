const fcmAdmin = require('firebase-admin');
const nodemailer = require('nodemailer');

class NotificationSender {
  constructor(fcmAuthFile, emailTransporterRequired) {
    this.upFCMServer(fcmAuthFile); 
    this.createEmailTransporter(emailTransporterRequired);
  }

  upFCMServer(fcmAuthFile) {
    this.fcmServer=fcmAdmin.initializeApp({
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

      case ('push'):
        this.sendPush(message, client);
        break;

      default:
        break;
    }
  }

  sendEmail(message, client) {
    if (message === undefined)
      return;

    const emailMessage = this.generateEmailMessage(message);
    const emailOptions = {
      from: 'lobovoiudar@yandex.ru',
      to: this.getClientEmail(client),
      subject: emailMessage.subject,
      body: emailMessage.body,
    };
    this.emailTransporter.sendMail(emailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  getClientEmail(client) {
    return 'lobovoiudar@yandex.ru';
  }

  generateEmailMessage(message) {
    const emailMessage = {
      subject: 'huyabject',
      body: 'huyody',
    };
    return emailMessage;
  }

  sendPush(message, client) {
    const clientToken = this.getClientToken(client);
    const pushMessage = this.generatePushMessage(message);
    this.fcmServer.messaging().sendToDevice(clientToken, pushMessage)
      .then((response) => {
        console.log('message is sent', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
  }

  getClientToken(client) {
    return 'cdCIfJbX3wQ:APA91bHNYxBIBFaFrioPAe55oI3iP5iqPUeJYMbEd5ZiKKmubceu6Frx56ZxEtuVvuepQg3xLG1UCVZwsaef75yOuXR3LuoOCuNBCzBYtIYGkPB1THmBZyfXnb5bnX4yZEyZeoUJvr4j';
  }

  generatePushMessage(message) {
    const pushMessage = {
      notification: {
        title: 'Trusty',
        body: 'zdraste',
      },
      data: {
        message: 'any data',
      }
    };
    return pushMessage;
  }
}

module.exports = NotificationSender;
