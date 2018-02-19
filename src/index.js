const { Apis } = require('bitsharesjs-ws');
const NotificationSender = require('./NotificationSender');
const OperationListener = require('./OperationListener');
const SubscriptionManager = require('./SubscriptionManager');
const config = require('../config');

const notificationSender = new NotificationSender('./trusty-informator-firebase-adminsdk-808sd-9702018d1f.json', config.emailTransport);

Apis.instance('wss://openledger.hk/ws', true).init_promise.then(async () => {
  const subscriptionManager = new SubscriptionManager();
  const serviceUserId = await subscriptionManager.setServiceUser(config.serviceUserBrainkey);
  const activeSubscriptions = await subscriptionManager.getActiveSubscriptions(['email']);
  console.log("Subscriptions", activeSubscriptions);
  //console.log("Active Subscriptions", activeSubscriptions);
  

/*
  const emails = { '1.2.512210': 'anlopan@gmail.com' };
  const operationListener = new OperationListener(['1.2.512210']);
  operationListener.setEventCallback((notification) => {
    const { userId, message } = notification;
    notificationSender.sendMessage(message, emails[userId], 'email');
  });*/
});

