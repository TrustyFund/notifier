const { Apis } = require('bitsharesjs-ws');
const NotificationSender = require('./NotificationSender');
const OperationListener = require('./OperationListener');
const SubscriptionManager = require('./SubscriptionManager');
const config = require('../config');


const notificationSender = new NotificationSender('./trusty-informator-firebase-adminsdk-808sd-9702018d1f.json', config.emailTransport);

Apis.instance('wss://openledger.hk/ws', true).init_promise.then(async () => {
  const subscriptionManager = new SubscriptionManager(config.deliveryMethods);
  const serviceUserId = await subscriptionManager.setServiceUser(config.serviceUserBrainkey);
  const activeSubscriptions = await subscriptionManager.getActiveSubscriptions();
  const clientsIds = subscriptionManager.getClientsIds();
  console.log('Subscriptions: ', activeSubscriptions);
  const operationListener = new OperationListener([serviceUserId, ...clientsIds]);
  operationListener.setEventCallback((notification) => {
    const { userId, message } = notification;

    if (userId === serviceUserId) {
      // manage subscriptions here
    } else {
      config.deliveryMethods.forEach((method) => {
        if (activeSubscriptions[method][userId] !== undefined) {
          notificationSender.sendMessage(message, activeSubscriptions[method][userId], method);
        }
      });
    }
  });
});

