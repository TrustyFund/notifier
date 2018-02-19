const { Apis } = require('bitsharesjs-ws');
const { ChainTypes } = require('bitsharesjs');

const operationTypesDictonary = ChainTypes.operations;
const fcmAdmin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');

const myAccount = '1.2.596737';

const fcmConfig = require('./trusty-informator-firebase-adminsdk-808sd-9702018d1f.json');

let tokenToSend;

host = express();
host.use(bodyParser.urlencoded({ extended: true }));

host.post('/token', (req, res) => {
  tokenToSend = req.body.token;
  console.log(tokenToSend);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    token: req.body.token || null,
  }));
});

host.listen(3000, () => {
  console.log('server is running');
});

fcmAdmin.initializeApp({
  credential: fcmAdmin.credential.cert(fcmConfig),
  databaseURL: 'https://trusty-informator.firebaseio.com'
});


const message = {
  notification: {
    title: '',
    body: ''
  },
  data: {
    message: ''
  }
};

const transporter = nodemailer.createTransport({
  service: 'yandex',
  auth: {
    user: 'your@gmail.com',
    pass: 'your_pass'
  }
});

const mailOptios = {
  from: 'from@gmail.com',
  to: 'to@gmail.com',
};


const api = {
  connect: () => {
    return Apis.instance('wss://dex.rnglab.org/ws', true).init_promise;
  },
  fetchAssets: (assets) => {
    return new Promise((resolve, reject) => {
      Apis.instance().db_api().exec('lookup_asset_symbols', [assets])
		    .then(asset_objects => {
		    	resolve(asset_objects);
		    })
        .catch(error => {
		        reject(error);
		    });
    });
  },
  fetchAccounts: (accounts) => {
    return new Promise((resolve, reject) => {
      Apis.instance().db_api().exec('get_accounts', [accounts])
        .then(account_objects => {
          resolve(account_objects);
        })
        .catch(error => {
          reject(error);
        });
    });
  },
};


api.connect().then((result) => {
  Apis.instance().db_api().exec('set_subscribe_callback', [fetchSubsribeCallback, true]);
});


function fetchSubsribeCallback(msg) {
  msg[0].forEach((value) => {
    writeToFile(JSON.stringify(value));
    if (Array.isArray(value)) {
      value.forEach((singeOp) => {
        checkOperations(singeOp);
      });
    } else {
      checkOperations(value);
    }
  });
}


function checkOperations(operation) {
  if (operation.id) {
    if (operation.id.includes('1.11.')) {
      if (operation.op[0] === operationTypesDictonary.transfer) {
        prepareForTransferNotification(operation.op[1]);
      }
    }
  }
}

function prepareForTransferNotification(source) {
  const fromAccountId = source.from;
  const toAccountId = source.to;

  const transferAssetId = source.amount.asset_id;
  const feeAssetId = source.fee.asset_id;

  const transferAmount = source.amount.amount;
  const feeAmount = source.fee.amount;

  const accountPromise = api.fetchAccounts([fromAccountId, toAccountId]);
  const assetPromise = api.fetchAssets([transferAssetId, feeAssetId]);

  let sender = false;

  if (fromAccountId === myAccount) {
    sender = true;
  } else if (toAccountId === myAccount) {
    sender = false;
  } else { return; }


  Promise.all([assetPromise, accountPromise])
    .then(values => {
      const transferAssetName = values[0][0].symbol;
      const transferAssetPrecision = values[0][0].precision;

      const feeAssetName = values[0][1].symbol;
      const feeAssetPrecision = values[0][1].precision;

      const fromAccountName = values[1][0].name;
      const toAccountName = values[1][1].name;


      const body = createTransferPushBody({
        transferAssetName,
        transferAssetPrecision,
        transferAmount,
        feeAssetName,
        feeAssetPrecision,
        feeAmount,
        bofromAccountName: fromAccountName,
        toAccountName,
        sender
      });

      sendNotification('Transfer', body);
    });
}

function createTransferPushBody(msg) {
  const transferValue = getRealBalance(msg.transferAmount, msg.transferAssetPrecision) + ' ' + msg.transferAssetName;
  if (msg.sender) {
    return transferValue + ' sent to ' + msg.toAccountName;
  }

  return transferValue + ' received from ' + msg.fromAccountName;
}

function sendNotification(operationType, msg) {
  if (!tokenToSend) { return; }

  message.notification.title = operationType;
  message.notification.body = msg;
  fcmAdmin.messaging().sendToDevice(tokenToSend, message)
    .then((response) => {
      console.log('message is sent', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });

  sendEmail('Transfer', msg);
}


function createPushBody(msg) {
  const transferValue = getRealBalance(msg.transferAmount, msg.transferAssetPrecision) + ' ' + msg.transferAssetName;
  if (msg.sender) {
    return transferValue + ' sent to ' + msg.toAccountName;
  }

  return transferValue + ' received from ' + msg.fromAccountName;
}

function getRealBalance(amount, precision) {
  return amount / (10 ** precision);
}

function writeToFile(data) {
  fs.appendFile('log1', data + '\n\n', (error) => {
    if (error) throw error;
  });
}

function sendEmail(theme, body) {
  mailOptios.subject =	theme;
  mailOptios.text = body;

  transporter.sendMail(mailOptios, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}
