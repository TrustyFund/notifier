const { Apis } = require('bitsharesjs-ws');
const Utils = require('./Utils');

const defaultAssets = ['BTS', 'BTC', 'OPEN.BTC'];
const utils = new Utils();

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
        const dict = { 0: 'transfer', 4: 'fill_order' };
        const opType = dict[operationId];

        // utils.writeToFile(JSON.stringify(operation));

        const filter = {
          transfer: { user_field: 'to', callback: this.retreiveTransfer.bind(this) },
          limit_order_create: { user_field: 'seller', callback: this.retreiveOrderCreate.bind(this) },
          fill_order: { user_field: 'account_id', callback: this.retreiveFillOrder.bind(this) }
        };

        if (opType !== undefined) {
          if ((filter[opType] !== undefined) && (this.usersIds.indexOf(payload[filter[opType].user_field]) > -1)) {
            this.eventCallback(payload[filter[opType].user_field], filter[opType].callback(operation));
          }
        }
      }
    }
  }

  retreiveTransfer(source) {
    const operation = source.op[1];
    const transferAsset = this.findAsset(operation.amount.asset_id);
    const value = utils.getRealCost(operation.amount.amount, transferAsset.precision);
    const message = { subject: 'Bitshares transfer', body: `You have been transferred ${transferAsset.symbol} ${value}` };
    return message;
  }

  async retreiveFillOrder(source) {
    const blockNum = source.block_num;
    const trxInBlock = source.trx_in_block;

    const { transactions } = await Apis.instance().db_api().exec('get_block', [blockNum]);
    const myTransaction = transactions[trxInBlock];

    const operation = source.op[1];
    const isBid = myTransaction.operations[0][1].amount_to_sell.asset_id === myTransaction.operations[0][1].fee.asset_id;

    const priceBase = (isBid) ? operation.receives : operation.pays;
    const priceQuote = (isBid) ? operation.pays : operation.receives;
    const amount = isBid ? operation.receives : operation.pays;

    const receivedAmount = operation.fee.asset_id === amount.asset_id ? amount.amount - operation.fee.amount : amount.amount;

    const fillOrderSide = isBid ? 'buy' : 'sell';

    const orderAsset = this.findAsset(amount.asset_id);
    const orderValue = { amount: utils.getRealCost(receivedAmount, orderAsset.precision), symbol: this.findAsset(amount.asset_id).symbol };

    const baseAsset = this.findAsset(priceBase.asset_id);
    const quoteAsset = this.findAsset(priceQuote.asset_id);
    const price = utils.formatPrice(priceBase.amount / priceQuote.amount, baseAsset, quoteAsset);

    const message = `${fillOrderSide} ${orderValue.amount} ${orderValue.symbol} at ${price} ${baseAsset.symbol}/${quoteAsset.symbol}`;
    return message;
  }

  findAsset(assetId) {
    let findAsset;
    this.fetchedAssets.forEach((asset) => {
      if (asset.id === assetId) {
        findAsset = asset;
      }
    });
    return findAsset !== undefined ? findAsset : assetId;
  }
}


module.exports = OperationListener;
