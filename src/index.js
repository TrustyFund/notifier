const { Apis } = require('bitsharesjs-ws');
const NotificationSender = require('./NotificationSender');
const OperationListener = require('./OperationListener');
const config = require('../config');

const notificationSender = new NotificationSender('./trusty-informator-firebase-adminsdk-808sd-9702018d1f.json', config.emailTransport);

Apis.instance('wss://dex.rnglab.org/ws', true).init_promise.then(() => {
  const emails = { '1.2.512210': 'anlopan@gmail.com' };
  const operationListener = new OperationListener(['1.2.512210']);
  operationListener.setEventCallback((notification) => {
    const { userId, message } = notification;
    notificationSender.sendMessage(message, emails[userId], 'email');
  });
});

