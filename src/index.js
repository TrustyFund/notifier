const TokenReceiver = require('./TokenReceiver');
const NotificationSender = require('./NotificationSender');
const ApiConnection = require('./ApiConnection');
const OperationListener = require('./OperationListener');
const config = require('../config');

const tokenReceiver = new TokenReceiver(2000);
tokenReceiver.hostReceiver();

const notificationSender = new NotificationSender('./trusty-informator-firebase-adminsdk-808sd-9702018d1f.json', config.emailTransport);

const apiConnection = new ApiConnection();
let operationListener;
apiConnection.connect().then((result) => {

  const emails = { '1.2.383374': 'anlopan@gmail.com' };
  operationListener = new OperationListener(['1.2.383374']);
  operationListener.setEventCallback((notification) => {
  	
    const { user_id, message } = notification;
    notificationSender.sendMessage(message, emails[user_id], 'email');
  });
});
