const {Apis} = require('bitsharesjs-ws');
const {ChainTypes} = require('bitsharesjs');
const operationTypesDictonary = ChainTypes.operations;
var fcmAdmin = require('firebase-admin');
var express = require('express');
var bodyParser = require('body-parser');

var accountsDist=['1.2.596737','1.2.512210'];
var myAccount='1.2.596737';

var fcmConfig = require("./trusty-informator-firebase-adminsdk-808sd-9702018d1f.json");
var registrationToken="d-VzUD40KFY:APA91bENnWv1l3cYVrlUcyi6doKBjfkicC4Ufna4_Z8qdqbU336jSScEi8-zH5iTgi77kKSGww8bZRHW0JsQMv22KZp0CPR1T4VTVBp64RqutJ6Pa8tW4KJGKZR3WIAIumNgZVvu4Dol";

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


var payload={
	data:{
		"title":"batya",
		"body":"s dnuhou"
	}
};

var message={
	notification:{
		title:"noti totle",
		body:"noti body"
	},
	data:{
		message:"huessage"
	}
}
console.log(message['notification']);

fcmAdmin.messaging().sendToDevice(registrationToken, message)
		.then(function(response){
			console.log("message is sent", response);
		})
		.catch(function (error){
			console.log("Error sending message:", error);
		});

console.log("test");

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
	Apis.instance().db_api().exec("set_pending_transaction_callback",[writeLog]);

});

function writeLog(msg){
	var jsoned=JSON.stringify(msg);
	fetchMsgOperations(msg);
}


var entriesArray=Array();
for(var value in Object.values(operationTypesDictonary)){
	entriesArray.push({'value':value, 'checked':false});
}

function fetchMsgOperations(msg){
	var operationsValue=JSON.stringify(msg[0]["operations"][0][0]);
	if(operationsValue==='0'){
		var fromAccountId = msg[0]['operations'][0][1]['from'];
		var toAccountId = msg[0]['operations'][0][1]['to'];

		var pass = false;
		var sender = false;  
		console.log(fromAccountId, myAccount);

		
		if(fromAccountId === myAccount){
			sender = true;
		}
		else if(toAccountId === myAccount){
			sender = false;
		}
		else
			return;

		console.log(fromAccountId,toAccountId);
		


		var transferAssetId = msg[0]['operations'][0][1]['amount']['asset_id'];
		var transferAmount = msg[0]['operations'][0][1]['amount']['amount'];

		var feeAssetId = msg[0]['operations'][0][1]['fee']['asset_id'];
		var feeAmount = msg[0]['operations'][0][1]['fee']['amount'];

		
		var assetPromise = api.fetchAssets([transferAssetId, feeAssetId]);
		var accountPromise = api.fetchAccounts([fromAccountId, toAccountId]);

		

		Promise.all([assetPromise, accountPromise]).then(values=>{
			var transferAssetName = values[0][0]['symbol'];
			var transferAssetPrecision = values[0][0]['precision'];

			var feeAssetName = values[0][1]['symbol'];
			var feeAssetPrecision = values[0][1]['precision'];

			var fromAccountName = values[1][0]['name'];
			var toAccountName = values[1][1]['name'];


			sendNotification({'transferAssetName': transferAssetName,
								'transferAssetPrecision': transferAssetPrecision,
								'transferAmount': transferAmount,
								'feeAssetName': feeAssetName,
								'feeAssetPrecision': feeAssetPrecision,
								'feeAmount': feeAmount,
								'fromAccountName': fromAccountName,
								'toAccountName': toAccountName,
								'sender': sender});
		});
	}
}

function sendNotification(msg){
	if(!tokenToSend)
		return;

	message['notification']['title'] = 'Transfer';
	message['notification']['body'] = createPushBody(msg); 
	fcmAdmin.messaging().sendToDevice(tokenToSend, message)
		.then(function(response){
			console.log("message is sent", response);
		})
		.catch(function (error){
			console.log("Error sending message:", error);
		});
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

function findInArray(value){
	return accountsDist.includes(value);
}

