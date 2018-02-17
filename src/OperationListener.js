const { Apis } = require('bitsharesjs-ws');
// const { ChainTypes } = require('bitsharesjs');

// const operationTypesDictonary = ChainTypes.operations;
const fs = require('fs');

const defaultAssets = ['BTS', 'BTC'];

class OperationListener {
  constructor(usersIds) {
    this.usersIds = usersIds;
    Apis.instance().db_api().exec('set_subscribe_callback', [(message) => {
      this.fetchSubsribeCallback(message);
    }, true]);
    const that = this;
    this.fetchAssets(defaultAssets).then(assetObjects => {
      that.setDefaultAssets(assetObjects);
    });
  }


  setDefaultAssets(assets) {
    this.fetchedAssets = assets;
    // console.log(this.fetchedAssets);
  }


  static fetchAssets(assets) {
    return Apis.instance().db_api().exec('lookup_asset_symbols', [assets]);
  }

  setEventCallback(callback) {
    this.eventCallback = callback;
  }

  fetchSubsribeCallback(message) {
    message[0].forEach((value) => {
      this.checkHistoryOperation(value);
    });
  }

  checkHistoryOperation(operation) {
    if (operation.id) {
      if (operation.id.includes('1.11.')) {
        const report = operation.op[1];
        const dict = ['transfer', 'limit_order_create'];

        const filter = {
          transfer: { user_field: 'to', callback: this.retreiveTransfer.bind(this) },
          limit_order_create: { user_field: 'seller', callback: this.retreiveOrderCreate.bind(this) },
          fill_order: { user_field: 'account_id', callback: this.retreiveFillOrder.bind(this) }
        };

        const op = dict[operation.op[0]];
        if (op !== undefined) {
          if ((filter[op] !== undefined) && (this.usersIds.indexOf(report[filter[op].user_field]) > -1)) {
            this.eventCallback(report[filter[op].user_field], filter[op].callback(report));
          }
        }
      }
    }
  }

  retreiveTransfer(source) {
    const value = this.getRealBalance(source.amount.asset_id, source.amount.amount);
    const result = `You have been transferred ${value.symbol} ${value.amount}`;
    const message = { subject: 'Bitshares transfer', body: result };
    console.log(message);
    return message;
  }


  getRealBalance(assetId, amount) {
    const result = { symbol: '', amount: '' };
    this.fetchedAssets.forEach((asset) => {
      if (asset.id === assetId) {
        result.symbol = asset.symbol;
      } else {
        result.symbol = 'some asset';
      }
      result.amount = this.getRealCost(amount, asset.precision);
    });
    return result;
  }

  static getRealCost(amount, precision) {
    return amount / (10 ** precision);
  }

  /*writeToFile( data ) {
    fs.appendFile('order_log', data + '\n\n', (error) => {
      if (error) throw error;
    });
  }*/

  retreiveOrderCreate (source) {
    const feeAmount = source.fee.amount;
    const feeAssetId = source.fee.asset_id;

    const seller = source.seller;

    const amountToSell = source.amount_to_sell.amount;
    const amountToSellAssetId = source.amount_to_sell.asset_id;

    const minToReceiveAmount = source.min_to_receive.amount;
    const minToReceiveAssetId = source.min_to_receive.asset_id;

    const expiration = source.expiration;
  }

  retreiveOrderCancel(source) {
    const feeAmount = source.fee.amount;
    const feeAssetId = source.fee.asset_id;
    const feePaymentAccounId = source.fee_paying_account;

    const orderId = source.order;
  }

  retreiveFillOrder(source) {
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
}



module.exports = OperationListener;
