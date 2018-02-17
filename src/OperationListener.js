const { Apis } = require('bitsharesjs-ws');
// const { ChainTypes } = require('bitsharesjs');

// const operationTypesDictonary = ChainTypes.operations;
// const fs = require('fs');

const defaultAssets = ['BTS', 'BTC'];

class OperationListener {
  constructor(usersIds) {
    this.usersIds = usersIds;
    Apis.instance().db_api().exec('set_subscribe_callback', [this.subsribeCallback.bind(this), true]);
    const that = this;
    Apis.instance().db_api().exec('lookup_asset_symbols', [defaultAssets]).then(assetObjects => {
      that.setDefaultAssets(assetObjects);
    });
  }


  setDefaultAssets(assets) {
    this.fetchedAssets = assets;
    // console.log(this.fetchedAssets);
  }

  setEventCallback(callback) {
    this.eventCallback = callback;
  }

  subsribeCallback([operations]) {
    operations.forEach((operation) => {
      this.checkOperation(operation);
    });
  }

  checkOperation(operation) {
    if (operation.id) {
      if (operation.id.includes('1.11.')) {
        const [operationId, payload] = operation.op;
        const dict = ['transfer', 'limit_order_create'];
        const opType = dict[operationId];

        const filter = {
          transfer: { user_field: 'to', callback: this.retreiveTransfer.bind(this) },
          limit_order_create: { user_field: 'seller', callback: this.retreiveOrderCreate.bind(this) },
          fill_order: { user_field: 'account_id', callback: this.retreiveFillOrder.bind(this) }
        };

        if (opType !== undefined) {
          if ((filter[opType] !== undefined) && (this.usersIds.indexOf(payload[filter[opType].user_field]) > -1)) {
            this.eventCallback(payload[filter[opType].user_field], filter[opType].callback(payload));
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
