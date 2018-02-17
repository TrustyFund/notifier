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
    const message = { subject: 'Bitshares transfer', body: `You have been transferred ${value.symbol} ${value.amount}` };
    return message;
  }

  retreiveFillOrder(source) {
    // const isMaker = source.isMaker;
    // const feeValue = this.getRealBalance(source.fee.asset_id, source.fee.amount);
    const receivesValue = this.getRealBalance(source.receives.asset_id, source.receives.amount);
    // const paysValue = this.getRealBalance(source.pays.asset_id, source.pays.amount);
    const baseValue = this.getRealBalance(source.fill_price.base.asset_id, source.fill_price.base.amount);
    const quoteValue = this.getRealBalance(source.fill_price.quote.asset_id, source.fill_price.quote.amount);

    const message = { subject: 'Fill order', body: `Order has been filled \n\n You received ${receivesValue.amount} ${receivesValue.symbol} at price  ${baseValue.symbol} / ${quoteValue.symbol}` };
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


}



module.exports = OperationListener;
