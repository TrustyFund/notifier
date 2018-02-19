const { Apis } = require('bitsharesjs-ws');

const Utils = require('./src/Utils');
var utils = new Utils();

Apis.instance('wss://dex.rnglab.org/ws', true).init_promise.then(() =>{
 Apis.instance().db_api().exec("get_objects",[["1.3.861"]]).
 	then(console.log)
});

function showBlocks(block){
	utils.writeToFile(JSON.stringify(block));	
}