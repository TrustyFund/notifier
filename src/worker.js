const NotificationSender = require('./NotificationSender');
const OperationListener = require('./OperationListener');
const SubscriptionManager = require('./SubscriptionManager');
const config = require('../config');

async function processWork() {
  const subscriptionManager = new SubscriptionManager(config.deliveryMethods);
  const notificationSender = new NotificationSender('./trusty-informator-firebase-adminsdk-808sd-9702018d1f.json', config.emailTransport);
  const serviceUserId = await subscriptionManager.setServiceUser(config.serviceUserBrainkey);
  let activeSubscriptions = await subscriptionManager.getActiveSubscriptions();
  const clientsIds = subscriptionManager.getClientsIds();
  console.log('Subscriptions: ', activeSubscriptions);
  console.log('Users', clientsIds);
  const operationListener = new OperationListener([serviceUserId, ...clientsIds]);

  operationListener.setEventCallback((notification) => {
    const {
      userId,
      message,
      type,
      payload
    } = notification;

    if (userId === serviceUserId) {
      if (type === 'transfer') {
        activeSubscriptions = subscriptionManager.processSubscription(payload, true);
        const newClientsIds = subscriptionManager.getClientsIds();
        operationListener.updateSubscribedUsers([serviceUserId, ...newClientsIds]);
        console.log('\n\nUpdate subscriptions', activeSubscriptions);
      }
    } else {
      config.deliveryMethods.forEach((method) => {
        if (activeSubscriptions[userId][method] !== undefined) {
          console.log('Sending message ', message, ' for ', activeSubscriptions[userId][method]);
          activeSubscriptions[userId][method].forEach((destination) => {
            notificationSender.sendMessage(message, destination, method);
          });
        }
      });
    }
  });
}

module.exports = processWork;
