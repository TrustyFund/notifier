const {Apis} = require('bitsharesjs-ws');
const {ChainTypes} = require('bitsharesjs');
const operationTypesDictonary = ChainTypes.operations;
const fs = require('fs');

const default_assets = ['BTS', 'BTC', ];

class OperationListener{


	constructor(users_ids){
		this.users_ids = users_ids;
		Apis.instance().db_api().exec("set_subscribe_callback",[(message) => {
			this.fetchSubsribeCallback(message)
		},true]);

		this.fetchAssets(default_assets);
	}



	fetchAssets (assets){
		return new Promise((resolve,reject) => {
			Apis.instance().db_api().exec( "lookup_asset_symbols", [ assets ] )
		    .then( asset_objects => {
	    		this.fetchedAssets=asset_objects;
	    		resolve(asset_objects);
		    }).catch( error => {
		        reject(error);
		    });
		})
	}

	setEventCallback(callback){
		this.eventCallback = callback;
	}

	fetchSubsribeCallback(message){
		message[0].forEach((value)=>{
				this.checkHistoryOperation(value);
		})
	}

	checkHistoryOperation(operation){
		if(operation['id']){
			if(operation['id'].includes('1.11.')){
				let report = operation['op'][1];
				let dict = ['transfer','limit_order_create'];

				let filter = {
					transfer: {user_field: 'to',callback: this.retreiveTransfer.bind(this)},
					limit_order_create: {user_field: 'seller',callback:this.retreiveOrderCreate.bind(this)},
					fill_order: {user_field: 'account_id',callback: this.retreiveFillOrder.bind(this)}
				}

				const op = dict[operation['op'][0]];
				if (op != undefined){
					if ((filter[op] != undefined) && (this.users_ids.indexOf(report[filter[op].user_field]) > -1)){
						this.eventCallback(user_id,filter[op].callback(report));
					}
					if(filter[op]!=undefined){
						this.eventCallback('1.2.512210',filter[op].callback(report));
					}
					
				}

			}
		}
	}

	retreiveTransfer(source){
		const fromAccountId = source.from;
		const toAccountId = source.to;


		// let transferAsset = this.findAssetSymbolInDefault(source.amount.asset_id);
		// let feeAsset = this.findAssetSymbolInDefault(source.fee.asset_id);

		const transferAmount = source.amount.amount;
		const feeAmount = source.fee.amount;

		const realAmount=this.getRealBalance(source.amount.asset_id, source.amount.amount);

		const message={subject:'Bitshares transfer',body:'You\'ve been transferred ${realAmount} transferAmount'}
		console.log(message);
		return message;
	}



	retreiveOrderCreate(source){
		const feeAmount = source.fee.amount;
		const feeAssetId = source.fee.asset_id;

		const seller = source.seller;

		const amountToSell = source.amount_to_sell.amount;
		const amountToSellAssetId = source.amount_to_sell.asset_id;

		const minToReceiveAmount = source.min_to_receive.amount;
		const minToReceiveAssetId = source.min_to_receive.asset_id;

		const expiration = source.expiration;

		//let amountToSellAsset = findAssetSymbolInDefault(minToReceiveAmount);

	}

	retreiveOrderCancel(source){
		const feeAmount = source.fee.amount;
		const feeAssetId = source.fee.asset_id;
		const feePaymentAccounId = source.fee_paying_account;

		const orderId = source.order;
	}

	retreiveFillOrder(source){
		const feeAmount = source.fee.amount;
		const feeAssetId = source.fee.asset_id;

		const orderId = source.order_id;
		const accountId = source.account_id;

		const paysAmount = source.pays.amount;
		const paysAssetId = source.pays.asset_id;

		const receivesAmount = source.receives.amount;
		const receivesAssetId = source.receives.asset_id;

		const baseeAmount = source.fill_price.base.amount;
		const baseAssetId = source.fill_price.base.asset_id;

		const quoteAmount = source.fill_price.quote.amount;
		const quoteAssetId = source.fill_price.quote.asset_id;

		const isMaker = source.isMaker;
	}

	getRealBalance(assetId, amount){
		let balance={symbol:'', realAmount};
		for(let asset in default_assets){
			if(asset.id === asset_id){
				balance.symbol = asset.symbol;
				balance.realAmount = this.getRealAmount(amount,asset.precision);
				console.log(balance);
			}
		}
		if(typeof assetSymbol === undefined){
			balance = {assetId,amount};
		}
		return balance;

	}

	getRealAmount(amount, precision){
		return amount / (10 ** precision);
	}

	writeToFile(data){
		fs.appendFile('order_log', data+'\n\n', function(error){
			if(error) throw error;
		});
	}
}

module.exports = OperationListener;  