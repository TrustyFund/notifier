const { Apis } = require('bitsharesjs-ws');
const NotificationSender = require('./NotificationSender');
const OperationListener = require('./OperationListener');
const SubscriptionManager = require('./SubscriptionManager');
const config = require('../config');


const notificationSender = new NotificationSender('./trusty-informator-firebase-adminsdk-808sd-9702018d1f.json', config.emailTransport);

Apis.instance('wss://openledger.hk/ws', true).init_promise.then(async () => {
  const subscriptionManager = new SubscriptionManager(['email']);
  const serviceUserId = await subscriptionManager.setServiceUser(config.serviceUserBrainkey);
  const activeSubscriptions = await subscriptionManager.getActiveSubscriptions();
  const clientsIds = subscriptionManager.getClientsIds();

  const operationListener = new OperationListener([serviceUserId,...clientsIds]);
  operationListener.setEventCallback((notification) => {
    const { userId, message } = notification;
    if (userId === serviceUserId){
      // manage subscriptions here
    }else{
      notificationSender.sendMessage(message, emails[userId], 'email');
    }
  });
});

