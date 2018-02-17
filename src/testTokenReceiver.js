const TokenReceiver = require('./TokenReceiver');
const NotificationSender = require('./NotificationSender');
const ApiConnection = require('./ApiConnection');
const OperationListener = require('./OperationListener');

const tokenReceiver = new TokenReceiver(3000);
tokenReceiver.hostReceiver();

const notificationSender = new NotificationSender(
  './trusty-informator-firebase-adminsdk-808sd-9702018d1f.json',
  {
    user: 'lobovoiudar@yandex.ru',
    pass: 'udarlobovoi',
    service: 'yandex'
  }
);

// notificationSender.sendMessage('privet', 'test', 'email');
// notificationSender.sendMessage('privet', 'test', 'push');

const apiConnection = new ApiConnection();
let operationListener;
apiConnection.connect()
  .then((result) => {
    const emails = { '1.2.512210': 'anlopan@gmail.com' };
    operationListener = new OperationListener(['1.2.512210'], );
    operationListener.setEventCallback((notification) => {
      const { user_id, message } = notification;
      notificationSender.sendMessage(message, emails[user_id], 'email');
    });
  });
