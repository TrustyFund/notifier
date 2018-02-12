const {Apis} = require('bitsharesjs-ws');
const {ChainTypes} = require('bitsharesjs');
const operationTypesDictonary = ChainTypes.operations;
var fcmAdmin = require('firebase-admin');
var express = require('express');
var bodyParser = require('body-parser');
const fs = require('fs');
var nodemailer = require('nodemailer');

var myAccount='1.2.596737';

var fcmConfig = require("./trusty-informator-firebase-adminsdk-808sd-9702018d1f.json");

var tokenToSend;

host = express();
host.use(bodyParser.urlencoded({extended:true}));

host.post('/token', function(req, res){
	tokenToSend=req.body.token;
	console.log(tokenToSend);
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({
		token: req.body.token || null,
	}));
})

host.listen(3000, function(){
	console.log('server is running');
})

fcmAdmin.initializeApp({
	credential: fcmAdmin.credential.cert(fcmConfig),
  	databaseURL: "https://trusty-informator.firebaseio.com"
});


var message={
	notification:{
		title:"",
		body:""
	},
	data:{
		message:""
	}
};

var transporter = nodemailer.createTransport({
	service:'yandex',
	auth:{
		user: 'your@gmail.com',
		pass: 'your_pass'
	}
});

var mailOptios={
		from: 'from@gmail.com',
		to: 'to@gmail.com',
};


var api = {
	connect: () => {
		return Apis.instance("wss://dex.rnglab.org/ws", true).init_promise;
	},
	fetchAssets: (assets) => {
		return new Promise((resolve,reject) => {
			Apis.instance().db_api().exec( "lookup_asset_symbols", [ assets ] )
		    .then( asset_objects => {
		    	resolve(asset_objects);
		    }).catch( error => {
		        reject(error);
		    });
		});
	},
	fetchAccounts: (accounts) => {
		return new Promise((resolve, reject) =>{
			Apis.instance().db_api().exec('get_accounts', [accounts] )
				.then(account_objects => {
					resolve(account_objects);
				})
				.catch(error => {
					reject(error);
				});
		});
	},
}


api.connect().then((result)=>{
	Apis.instance().db_api().exec("set_subscribe_callback",[fetchSubsribeCallback,true]);
});



function fetchSubsribeCallback(msg){
	msg[0].forEach(function(value){
		if(Array.isArray(value)){
			value.forEach(function(singeOp){
				checkOperations(singeOp);
			})
		}
		else{
			checkOperations(value);

		}
	})
}


function checkOperations(operation){
	if(operation['id']){
		if(operation['id'].includes('1.11.')){
			if(operation['op'][0]===operationTypesDictonary['transfer']){
				prepareForTransferNotification(operation['op'][1]);

			}
		}
	}
}

function prepareForTransferNotification(source){
	var fromAccountId = source['from'];
	var toAccountId = source['to'];

	var transferAssetId = source['amount']['asset_id'];
	var feeAssetId = source['fee']['asset_id'];

	var transferAmount = source['amount']['amount'];
	var feeAmount = source['fee']['amount'];

	var accountPromise = api.fetchAccounts([fromAccountId, toAccountId]);			
	var assetPromise = api.fetchAssets([transferAssetId, feeAssetId]);

	var sender=false;

	if(fromAccountId === myAccount){
			sender = true;
	}
	else if(toAccountId === myAccount){
		sender = false;
	}
	else
		return;


	Promise.all([assetPromise, accountPromise])
		.then(values=>{
			var transferAssetName = values[0][0]['symbol'];
			var transferAssetPrecision = values[0][0]['precision'];

			var feeAssetName = values[0][1]['symbol'];
			var feeAssetPrecision = values[0][1]['precision'];

			var fromAccountName = values[1][0]['name'];
			var toAccountName = values[1][1]['name'];
			
			
			var body = createTransferPushBody({'transferAssetName': transferAssetName,
								'transferAssetPrecision': transferAssetPrecision,
								'transferAmount': transferAmount,
								'feeAssetName': feeAssetName,
								'feeAssetPrecision': feeAssetPrecision,
								'feeAmount': feeAmount,
								'bofromAccountName': fromAccountName,
								'toAccountName': toAccountName,
								'sender': sender})

			sendNotification('Transfer', body);
		});	

}

function createTransferPushBody(msg){
	var transferValue=getRealBalance(msg['transferAmount'], msg['transferAssetPrecision'])+' '+msg['transferAssetName'];
	if(msg['sender']){
		return transferValue +' sent to '+ msg['toAccountName'];
	}
	else{
		return transferValue + ' received from '+ msg['fromAccountName'];
	}
}

function sendNotification(operationType, msg){
	if(!tokenToSend)
		return;

	message['notification']['title'] = operationType;
	message['notification']['body'] = msg; 
	fcmAdmin.messaging().sendToDevice(tokenToSend, message)
		.then(function(response){
			console.log("message is sent", response);
		})
		.catch(function (error){
			console.log("Error sending message:", error);
		});

	sendEmail("Transfer", msg);
}


function createPushBody(msg){
	var transferValue=getRealBalance(msg['transferAmount'], msg['transferAssetPrecision'])+' '+msg['transferAssetName'];
	if(msg['sender']){
		return transferValue +' sent to '+ msg['toAccountName'];
	}
	else{
		return transferValue + ' received from '+ msg['fromAccountName'];
	}
}

function getRealBalance(amount, precision){
	return amount / (10 ** precision);
}


function sendEmail(theme, body){
	mailOptios['subject'] =	theme;
	mailOptios['text'] = body;

	transporter.sendMail(mailOptios, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
			}
	});
}