const TokenReceiver = require('./TokenReceiver');
const NotificationSender = require('./NotificationSender');
const ApiConnection = require('./ApiConnection');
const OperationListener = require('./OperationListener');

var tokenReceiver = new TokenReceiver(3000)
tokenReceiver.hostReceiver();

var notificationSender = new NotificationSender('./trusty-informator-firebase-adminsdk-808sd-9702018d1f.json',
												{user:'lobovoiudar@yandex.ru',
												pass: 'udarlobovoi',
												service:'yandex'});

// notificationSender.sendMessage('privet', 'test', 'email');
// notificationSender.sendMessage('privet', 'test', 'push');

var apiConnection = new ApiConnection();
var operationListener;
apiConnection.connect()
	.then((result)=>{
		operationListener = new OperationListener();
	});
